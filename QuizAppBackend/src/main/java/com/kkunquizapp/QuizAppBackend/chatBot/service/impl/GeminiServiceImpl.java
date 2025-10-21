package com.kkunquizapp.QuizAppBackend.chatBot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.question.dto.OptionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.OptionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.chatBot.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.question.model.Option;
import com.kkunquizapp.QuizAppBackend.question.model.Question;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.chatBot.service.GeminiService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.text.Normalizer;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class GeminiServiceImpl implements GeminiService {

    private final WebClient geminiWebClient;
    private final ObjectMapper mapper;
    private final QuizRepo quizRepo;
    private final QuestionRepo questionRepo;

    // ==== ENV/Config ====
    @Value("${gemini.api.key}")                        private String apiKey;
    @Value("${gemini.api.model:gemini-2.0-flash}")     private String modelName;
    @Value("${gemini.api.max-output-tokens:8192}")     private int maxOutputTokens;
    @Value("${gemini.api.temperature:0.1}")            private double temperature;
    @Value("${gemini.api.top-p:0.8}")                  private double topP;
    @Value("${gemini.api.candidate-count:1}")          private int candidateCount;

    // Retry/backoff
    @Value("${gemini.api.retry.max-attempts:5}")         private int retryMaxAttempts;
    @Value("${gemini.api.retry.initial-backoff-ms:500}")  private long retryInitialMs;
    @Value("${gemini.api.retry.max-backoff-ms:5000}")     private long retryMaxMs;
    @Value("${gemini.api.retry.jitter:true}")             private boolean retryJitter;

    // Business limits
    @Value("${limits.max-questions:10}")               private int maxQuestions;
    @Value("${limits.max-topic-chars:300}")            private int maxTopicChars;

    // Batch size for generating questions
    private static final int BATCH_SIZE = 3;
    private static final double SIMILARITY_THRESHOLD = 0.90;

    public GeminiServiceImpl(
            WebClient geminiWebClient,
            ObjectMapper mapper,
            QuizRepo quizRepo,
            QuestionRepo questionRepo
    ) {
        this.geminiWebClient = geminiWebClient;
        this.mapper = mapper;
        this.quizRepo = quizRepo;
        this.questionRepo = questionRepo;
    }

    @PostConstruct
    public void sanity() {
        modelName = modelName == null ? "" : modelName.trim();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY chưa được set!");
        }
        if (modelName.isBlank()) {
            throw new IllegalStateException("gemini.api.model trống!");
        }
    }

    // =========================================================
    // ===============  Public API  ============================
    // =========================================================

    @Override
    public QuestionRequestDTO generateOptionsForQuestion(QuestionRequestDTO request) throws Exception {
        QuestionType qType = safeParseType(request.getQuestionType());

        String rulesByType = switch (qType) {
            case TRUE_FALSE -> "Generate exactly 2 options: \"True\" and \"False\". Only one correct=true.";
            case SINGLE_CHOICE -> "Generate 1 correct and 3 wrong answers (total 4). Only 1 correct=true.";
            case MULTIPLE_CHOICE -> "Generate 4 options total, 2-3 with correct=true.";
            default -> "If type unknown, default to SINGLE_CHOICE.";
        };

        String prompt = String.format("""
                JSON only. No explanations.
                
                Generate options for this question:
                {"options":[{"optionText":"string","correct":true|false,"correctAnswer":"string"}]}
                
                Question: "%s"
                Type: %s | Points: %d | Time: %d sec
                Rules: %s
                
                correctAnswer = all correct options joined by "; "
                Return only JSON starting with {
                """,
                Optional.ofNullable(request.getQuestionText()).orElse(""),
                qType.name(), request.getPoints(), request.getTimeLimit(), rulesByType
        );

        String raw = callGemini(prompt);
        String jsonText = extractJsonText(raw);
        JsonNode json = mapper.readTree(jsonText);

        List<OptionRequestDTO> options = new ArrayList<>();
        if (json.has("options") && json.get("options").isArray()) {
            for (JsonNode op : json.get("options")) {
                var dto = new OptionRequestDTO();
                dto.setOptionId(UUID.randomUUID());
                dto.setOptionText(op.path("optionText").asText(""));
                dto.setCorrect(op.path("correct").asBoolean(false));
                dto.setCorrectAnswer(op.path("correctAnswer").asText(""));
                options.add(dto);
            }
        }

        options = postValidateAndNormalize(options, qType);

        request.setOptions(options);
        request.setQuestionType(qType.name());
        return request;
    }

    @Override
    public List<QuestionResponseDTO> generateByTopic(TopicGenerateRequest req) {
        try {
            final String lang = (req.getLanguage() == null || req.getLanguage().isBlank()) ? "vi" : req.getLanguage();
            int target = (req.getCount() == null || req.getCount() < 1) ? 5 : Math.min(req.getCount(), maxQuestions);

            String topic = Optional.ofNullable(req.getTopic()).orElse("");
            if (topic.length() > maxTopicChars) topic = topic.substring(0, maxTopicChars);

            final String qTypeStr = (req.getQuestionType() == null) ? "AUTO" : req.getQuestionType().trim().toUpperCase(Locale.ROOT);
            final int timeLimit = (req.getTimeLimit() == null || req.getTimeLimit() <= 0) ? 60 : req.getTimeLimit();
            final int points = (req.getPoints() == null || req.getPoints() <= 0) ? 1000 : req.getPoints();

            // Collect existing question keys for deduplication
            Set<String> existingKeys = Collections.emptySet();
            String seedFromQuiz = "";
            boolean dedupe = Boolean.TRUE.equals(req.getDedupe());
            if (dedupe && req.getQuizId() != null) {
                Quiz quiz = quizRepo.findById(req.getQuizId())
                        .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

                List<Question> existing = questionRepo.findActiveQuestionsByQuiz(quiz);
                existingKeys = existing.stream().map(this::makeQuestionKey).collect(Collectors.toSet());
                seedFromQuiz = (quiz.getTitle() == null ? "" : quiz.getTitle()) + " " +
                        (quiz.getDescription() == null ? "" : quiz.getDescription());
            }

            // Generate questions in small batches
            final int attemptMax = 8; // Increased attempts
            List<QuestionResponseDTO> kept = new ArrayList<>();
            Set<String> batchKeys = new HashSet<>();

            for (int attempt = 1; attempt <= attemptMax && kept.size() < target; attempt++) {
                int need = target - kept.size();
                int ask = Math.min(need, BATCH_SIZE);

                String prompt = buildCompactPrompt(lang, ask, topic, seedFromQuiz, qTypeStr, timeLimit, points);

                try {
                    String raw = callGemini(prompt);
                    String jsonText = extractJsonText(raw);
                    JsonNode json = mapper.readTree(jsonText);

                    if (json.has("questions") && json.get("questions").isArray()) {
                        for (JsonNode q : json.get("questions")) {
                            QuestionResponseDTO dto = mapToQuestionDTO(q, qTypeStr, timeLimit, points);

                            if (!isValidForPreview(dto)) continue;

                            String key = makeQuestionKey(dto);
                            if (existingKeys.contains(key) || batchKeys.contains(key)) continue;
                            if (isTooSimilar(dto, kept)) continue;

                            kept.add(dto);
                            batchKeys.add(key);
                            if (kept.size() >= target) break;
                        }
                    }
                } catch (Exception e) {
                    System.err.println("[Gemini] Attempt " + attempt + " failed: " + e.getMessage());
                    // Continue to next attempt
                }

                // Small delay between batches
                if (kept.size() < target && attempt < attemptMax) {
                    try {
                        Thread.sleep(200);
                    } catch (InterruptedException ignored) {
                    }
                }
            }

            return kept;

        } catch (Exception e) {
            throw new RuntimeException("Error in generateByTopic: " + e.getMessage(), e);
        }
    }

    // =========================================================
    // =============== Gemini Caller ===========================
    // =========================================================

    private String callGemini(String prompt) throws Exception {
        return callGeminiWithRetry(prompt, 0);
    }

    private String callGeminiWithRetry(String prompt, int attemptCount) throws Exception {
        if (attemptCount >= 3) {
            throw new RuntimeException("Failed to get valid JSON response from Gemini after 3 attempts");
        }

        var body = mapper.createObjectNode();

        var contents = mapper.createArrayNode();
        var content = mapper.createObjectNode();
        var parts = mapper.createArrayNode();
        parts.add(mapper.createObjectNode().put("text", prompt));
        content.set("parts", parts);
        contents.add(content);
        body.set("contents", contents);

        body.set("generationConfig", buildGenConfig());

        String url = modelUrl();

        Retry retrySpec = Retry
                .backoff(Math.max(0, retryMaxAttempts - 1), Duration.ofMillis(retryInitialMs))
                .maxBackoff(Duration.ofMillis(retryMaxMs))
                .filter(throwable -> {
                    if (throwable instanceof WebClientResponseException ex) {
                        int sc = ex.getRawStatusCode();
                        return sc == 503 || sc == 502 || sc == 504 || sc == 429;
                    }
                    return throwable instanceof java.io.IOException;
                })
                .jitter(retryJitter ? 0.5d : 0.0d)
                .doBeforeRetry(sig -> {
                    System.err.println("[Gemini] Retry " + sig.totalRetriesInARow()
                            + " after failure: " + sig.failure().getMessage());
                });

        try {
            String response = geminiWebClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .exchangeToMono(res -> res.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(b -> {
                                if (!res.statusCode().is2xxSuccessful()) {
                                    return Mono.error(new RuntimeException(
                                            "Gemini HTTP " + res.statusCode().value() + ": " + b));
                                }
                                return Mono.just(b);
                            }))
                    .retryWhen(retrySpec)
                    .block();

            // Validate response
            try {
                String jsonText = extractJsonText(response);
                mapper.readTree(jsonText); // Validate JSON
                return response;
            } catch (Exception e) {
                if (e.getMessage() != null && e.getMessage().contains("incomplete")) {
                    System.err.println("[Gemini] Attempt " + (attemptCount + 1) + " incomplete, retrying...");
                    String modifiedPrompt = "JSON ONLY:\n" + prompt;
                    return callGeminiWithRetry(modifiedPrompt, attemptCount + 1);
                }
                throw e;
            }

        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("incomplete") && attemptCount < 2) {
                System.err.println("[Gemini] Retry due to incomplete response...");
                return callGeminiWithRetry("Return only JSON: " + prompt, attemptCount + 1);
            }
            throw e;
        }
    }

    private com.fasterxml.jackson.databind.node.ObjectNode buildGenConfig() {
        var genCfg = mapper.createObjectNode();
        genCfg.put("response_mime_type", "application/json");

        // Dynamic token limit
        int dynamicMaxTokens = Math.max(maxOutputTokens, 8192);
        genCfg.put("maxOutputTokens", dynamicMaxTokens);

        genCfg.put("temperature", temperature);
        genCfg.put("topP", topP);
        genCfg.put("candidateCount", candidateCount);

        // No stop sequences for JSON generation
        return genCfg;
    }

    private String modelUrl() {
        return "/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
    }

    // =========================================================
    // =============== Prompt Builder ==========================
    // =========================================================

    private String buildCompactPrompt(String lang, int count, String topic, String context,
                                      String qType, int timeLimit, int points) {
        String localeNote = lang.equalsIgnoreCase("en")
                ? "English only."
                : "Tiếng Việt.";

        String typeRule = qType.equals("AUTO")
                ? "Mix types appropriately"
                : qType;

        return String.format("""
                %s Generate %d questions: "%s"
                
                JSON format:
                {"questions":[{
                  "questionText":"...",
                  "questionType":"TRUE_FALSE|SINGLE_CHOICE|MULTIPLE_CHOICE",
                  "timeLimit":%d,
                  "points":%d,
                  "options":[{"optionText":"...","correct":true|false,"correctAnswer":"..."}]
                }]}
                
                Rules:
                - TRUE_FALSE: 2 options, 1 correct
                - SINGLE_CHOICE: 4 options, 1 correct  
                - MULTIPLE_CHOICE: 4 options, 2-3 correct
                - Type: %s
                - correctAnswer = all correct options joined by "; "
                
                Return only JSON.
                """, localeNote, count, topic, timeLimit, points, typeRule);
    }

    // =========================================================
    // =============== JSON Extraction =========================
    // =========================================================

    private String extractJsonText(String raw) throws Exception {
        JsonNode root = mapper.readTree(raw);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.size() == 0) {
            throw new RuntimeException("Gemini returned no candidates");
        }

        JsonNode candidate = candidates.get(0);
        String finishReason = candidate.path("finishReason").asText();

        // Handle MAX_TOKENS gracefully
        if ("MAX_TOKENS".equalsIgnoreCase(finishReason)) {
            System.err.println("[GEMINI] Warning: Response truncated at MAX_TOKENS, attempting to parse...");
        }

        JsonNode parts = candidate.path("content").path("parts");
        if (!parts.isArray() || parts.size() == 0) {
            throw new RuntimeException("Gemini returned no parts");
        }

        String text = parts.get(0).path("text").asText();
        if (text.isBlank()) {
            throw new RuntimeException("Gemini returned empty text");
        }

        // Try to sanitize and extract JSON
        try {
            return sanitizeToJson(text);
        } catch (Exception e) {
            if ("MAX_TOKENS".equalsIgnoreCase(finishReason)) {
                String fixed = tryFixIncompleteJson(text);
                if (fixed != null) return fixed;
            }
            throw e;
        }
    }

    private String sanitizeToJson(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new RuntimeException("Raw text is null or empty");
        }

        String trimmed = rawText.trim();

        // Direct JSON extraction
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            if (trimmed.startsWith("{")) {
                int endIndex = findMatchingBrace(trimmed, '{', '}');
                if (endIndex > 0) return trimmed.substring(0, endIndex);
            } else if (trimmed.startsWith("[")) {
                int endIndex = findMatchingBrace(trimmed, '[', ']');
                if (endIndex > 0) return trimmed.substring(0, endIndex);
            }
        }

        // Remove markdown
        trimmed = trimmed.replaceAll("^```json\\s*", "").replaceAll("```\\s*$", "");
        trimmed = trimmed.replaceAll("^```\\s*", "").replaceAll("```\\s*$", "");

        // Regex patterns
        Pattern objectPattern = Pattern.compile("\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}", Pattern.DOTALL);
        Matcher objectMatcher = objectPattern.matcher(trimmed);
        if (objectMatcher.find()) return objectMatcher.group();

        Pattern arrayPattern = Pattern.compile("\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\][^\\[\\]]*)*\\]", Pattern.DOTALL);
        Matcher arrayMatcher = arrayPattern.matcher(trimmed);
        if (arrayMatcher.find()) return arrayMatcher.group();

        // Aggressive extraction
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }

        int firstBracket = trimmed.indexOf('[');
        int lastBracket = trimmed.lastIndexOf(']');
        if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket) {
            return trimmed.substring(firstBracket, lastBracket + 1);
        }

        throw new RuntimeException("Could not extract valid JSON from response");
    }

    private int findMatchingBrace(String text, char open, char close) {
        int count = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == open) count++;
            else if (c == close) {
                count--;
                if (count == 0) return i + 1;
            }
        }
        return -1;
    }

    private String tryFixIncompleteJson(String text) {
        try {
            String trimmed = text.trim();

            // Fix missing closing braces
            if (trimmed.startsWith("{") && !trimmed.endsWith("}")) {
                long openBraces = trimmed.chars().filter(ch -> ch == '{').count();
                long closeBraces = trimmed.chars().filter(ch -> ch == '}').count();

                String fixed = trimmed + "}".repeat((int) (openBraces - closeBraces));
                mapper.readTree(fixed);
                return fixed;
            }

            // Fix incomplete questions array
            if (trimmed.contains("\"questions\":[") && !trimmed.endsWith("]}")) {
                String fixed = trimmed;
                if (!fixed.endsWith("]")) fixed += "]";
                if (!fixed.endsWith("}")) fixed += "}";

                mapper.readTree(fixed);
                return fixed;
            }

        } catch (Exception ignored) {
        }
        return null;
    }

    // =========================================================
    // =============== DTO Mapping =============================
    // =========================================================

    private QuestionResponseDTO mapToQuestionDTO(JsonNode q, String qTypeStr, int timeLimit, int points) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        dto.setQuestionText(q.path("questionText").asText(""));

        String typeFromAi = q.path("questionType").asText("");
        String finalType = !"AUTO".equals(qTypeStr) ? qTypeStr : typeFromAi;
        QuestionType type = safeParseType(
                (finalType == null || finalType.isBlank()) ? "SINGLE_CHOICE" : finalType
        );

        dto.setQuestionType(type.name());
        dto.setTimeLimit(timeLimit);
        dto.setPoints(points);

        List<OptionResponseDTO> options = new ArrayList<>();
        if (q.has("options") && q.get("options").isArray()) {
            for (JsonNode op : q.get("options")) {
                OptionResponseDTO o = new OptionResponseDTO();
                o.setOptionText(op.path("optionText").asText(""));
                o.setCorrect(op.path("correct").asBoolean(false));
                o.setCorrectAnswer(op.path("correctAnswer").asText(""));
                options.add(o);
            }
        }

        options = normalizeOptionsForPreview(options, type);
        dto.setOptions(options);

        return dto;
    }

    // =========================================================
    // =============== Validation & Normalization ==============
    // =========================================================

    private QuestionType safeParseType(String typeStr) {
        if (typeStr == null) return QuestionType.SINGLE_CHOICE;
        try {
            return QuestionType.valueOf(typeStr.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return QuestionType.SINGLE_CHOICE;
        }
    }

    private List<OptionRequestDTO> postValidateAndNormalize(List<OptionRequestDTO> options, QuestionType type) {
        if (options == null) options = new ArrayList<>();

        options = options.stream()
                .filter(o -> o.getOptionText() != null && !o.getOptionText().isBlank())
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(
                                o -> o.getOptionText().trim(),
                                o -> o,
                                (a, b) -> a,
                                LinkedHashMap::new
                        ),
                        m -> new ArrayList<>(m.values())
                ));

        switch (type) {
            case TRUE_FALSE -> options = forceTrueFalse(options);
            case SINGLE_CHOICE -> {
                options = ensureMaxSize(options, 4);
                enforceSingleCorrect(options);
            }
            case MULTIPLE_CHOICE -> {
                options = ensureMaxSize(options, 4);
                ensureAtLeastTwoCorrect(options);
            }
            default -> {
            }
        }

        String correctJoined = options.stream()
                .filter(OptionRequestDTO::isCorrect)
                .map(OptionRequestDTO::getOptionText)
                .collect(Collectors.joining("; "));
        for (var o : options) {
            o.setCorrectAnswer(correctJoined);
            if (o.getOptionId() == null) o.setOptionId(UUID.randomUUID());
        }
        return options;
    }

    private List<OptionRequestDTO> forceTrueFalse(List<OptionRequestDTO> options) {
        OptionRequestDTO t = new OptionRequestDTO();
        t.setOptionId(UUID.randomUUID());
        t.setOptionText("True");

        OptionRequestDTO f = new OptionRequestDTO();
        f.setOptionId(UUID.randomUUID());
        f.setOptionText("False");

        boolean trueCorrect = options.stream()
                .anyMatch(o -> "true".equalsIgnoreCase(o.getOptionText()) && o.isCorrect());

        t.setCorrect(trueCorrect || !anyCorrect(options));
        f.setCorrect(!t.isCorrect());

        String ca = t.isCorrect() ? "True" : "False";
        t.setCorrectAnswer(ca);
        f.setCorrectAnswer(ca);
        return List.of(t, f);
    }

    private boolean anyCorrect(List<OptionRequestDTO> options) {
        return options.stream().anyMatch(OptionRequestDTO::isCorrect);
    }

    private List<OptionRequestDTO> ensureMaxSize(List<OptionRequestDTO> options, int max) {
        if (options.size() > max) return new ArrayList<>(options.subList(0, max));
        return options;
    }

    private void enforceSingleCorrect(List<OptionRequestDTO> options) {
        boolean found = false;
        for (var o : options) {
            if (o.isCorrect() && !found) {
                found = true;
            } else {
                o.setCorrect(false);
            }
        }
        if (!found && !options.isEmpty()) {
            options.get(0).setCorrect(true);
        }
    }

    private void ensureAtLeastTwoCorrect(List<OptionRequestDTO> options) {
        long count = options.stream().filter(OptionRequestDTO::isCorrect).count();
        if (options.size() >= 2 && count < 2) {
            for (int i = 0; i < options.size(); i++) {
                options.get(i).setCorrect(i < 2);
            }
        }
    }

    // =========================================================
    // =============== Preview Validation ======================
    // =========================================================

    private List<OptionResponseDTO> normalizeOptionsForPreview(List<OptionResponseDTO> options, QuestionType type) {
        if (options == null) options = new ArrayList<>();

        options = options.stream()
                .filter(o -> o.getOptionText() != null && !o.getOptionText().isBlank())
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(
                                o -> o.getOptionText().trim(),
                                o -> o,
                                (a, b) -> a,
                                LinkedHashMap::new
                        ), m -> new ArrayList<>(m.values())
                ));

        switch (type) {
            case TRUE_FALSE -> {
                OptionResponseDTO t = new OptionResponseDTO();
                t.setOptionText("True");
                OptionResponseDTO f = new OptionResponseDTO();
                f.setOptionText("False");

                boolean tCorrect = options.stream()
                        .anyMatch(o -> "true".equalsIgnoreCase(o.getOptionText()) && Boolean.TRUE.equals(o.getCorrect()));

                if (!tCorrect && options.stream().noneMatch(o -> Boolean.TRUE.equals(o.getCorrect()))) {
                    tCorrect = true;
                }
                t.setCorrect(tCorrect);
                f.setCorrect(!tCorrect);

                String ca = t.getCorrect() ? "True" : "False";
                t.setCorrectAnswer(ca);
                f.setCorrectAnswer(ca);

                options = List.of(t, f);
            }
            case SINGLE_CHOICE -> {
                if (options.size() > 4) options = new ArrayList<>(options.subList(0, 4));
                long c = options.stream().filter(o -> Boolean.TRUE.equals(o.getCorrect())).count();
                if (c == 0 && !options.isEmpty()) options.get(0).setCorrect(true);
                if (c > 1) {
                    boolean first = true;
                    for (var o : options) {
                        if (Boolean.TRUE.equals(o.getCorrect())) {
                            if (first) first = false;
                            else o.setCorrect(false);
                        }
                    }
                }
                String ca = options.stream().filter(o -> Boolean.TRUE.equals(o.getCorrect()))
                        .map(OptionResponseDTO::getOptionText)
                        .collect(Collectors.joining("; "));
                for (var o : options) o.setCorrectAnswer(ca);
            }
            case MULTIPLE_CHOICE -> {
                if (options.size() > 4) options = new ArrayList<>(options.subList(0, 4));
                long c = options.stream().filter(o -> Boolean.TRUE.equals(o.getCorrect())).count();
                if (options.size() >= 2 && c < 2) {
                    for (int i = 0; i < options.size(); i++) {
                        options.get(i).setCorrect(i < 2);
                    }
                }
                String ca = options.stream().filter(o -> Boolean.TRUE.equals(o.getCorrect()))
                        .map(OptionResponseDTO::getOptionText)
                        .collect(Collectors.joining("; "));
                for (var o : options) o.setCorrectAnswer(ca);
            }
            case FILL_IN_THE_BLANK -> {
                String ans = options.isEmpty() ? "" : options.get(0).getOptionText();
                OptionResponseDTO only = new OptionResponseDTO();
                only.setOptionText(ans);
                only.setCorrect(true);
                only.setCorrectAnswer(ans);
                options = List.of(only);
            }
            default -> {
            }
        }

        return options;
    }

    private boolean isValidForPreview(QuestionResponseDTO dto) {
        if (dto == null) return false;
        if (dto.getQuestionText() == null || dto.getQuestionText().isBlank()) return false;
        if (dto.getOptions() == null || dto.getOptions().isEmpty()) return false;

        QuestionType type = safeParseType(dto.getQuestionType());
        long correctCount = dto.getOptions().stream().filter(o -> Boolean.TRUE.equals(o.getCorrect())).count();

        return switch (type) {
            case SINGLE_CHOICE -> dto.getOptions().size() >= 2 && correctCount == 1;
            case MULTIPLE_CHOICE -> correctCount >= 1;
            case TRUE_FALSE -> dto.getOptions().size() == 2;
            case FILL_IN_THE_BLANK -> dto.getOptions().size() == 1;
            default -> true;
        };
    }

    // Key chuẩn hoá cho entity DB
    private String makeQuestionKey(Question q) {
        String stem = normalizeText(q.getQuestionText());
        String opts = q.getOptions().stream()
                .map(Option::getOptionText)
                .map(this::normalizeText)
                .sorted()
                .collect(Collectors.joining("|"));
        return stem + "||" + opts;
    }

    // Key chuẩn hoá cho DTO preview
    private String makeQuestionKey(QuestionResponseDTO q) {
        String stem = normalizeText(q.getQuestionText());
        String opts = q.getOptions().stream()
                .map(OptionResponseDTO::getOptionText)
                .map(this::normalizeText)
                .sorted()
                .collect(Collectors.joining("|"));
        return stem + "||" + opts;
    }

    private String normalizeText(String s) {
        if (s == null) return "";
        String noAccent = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return noAccent
                .replaceAll("[\\p{Punct}]", " ")
                .replaceAll("\\s+", " ")
                .toLowerCase()
                .trim();
    }

    private boolean isTooSimilar(QuestionResponseDTO candidate, List<QuestionResponseDTO> kept) {
        String cand = normalizeText(candidate.getQuestionText());
        for (QuestionResponseDTO ex : kept) {
            String exq = normalizeText(ex.getQuestionText());
            double sim = jaccardWords(cand, exq);
            if (sim >= 0.90) return true; // ngưỡng có thể chỉnh
        }
        return false;
    }

    private double jaccardWords(String a, String b) {
        Set<String> A = new HashSet<>(Arrays.asList(a.split(" ")));
        Set<String> B = new HashSet<>(Arrays.asList(b.split(" ")));
        if (A.isEmpty() && B.isEmpty()) return 1.0;
        Set<String> inter = new HashSet<>(A); inter.retainAll(B);
        Set<String> union = new HashSet<>(A); union.addAll(B);
        return union.isEmpty() ? 0.0 : (double) inter.size() / (double) union.size();
    }
}
