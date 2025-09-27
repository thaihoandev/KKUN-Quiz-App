package com.kkunquizapp.QuizAppBackend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.dto.OptionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.service.GeminiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class GeminiServiceImpl implements GeminiService {

    private final WebClient geminiWebClient;
    private final ObjectMapper mapper;

    // ==== ENV/Config ====
    @Value("${gemini.api.key}")                        private String apiKey;
    @Value("${gemini.api.model:gemini-2.0-flash}")     private String modelName;
    @Value("${gemini.api.max-output-tokens:4096}")     private int maxOutputTokens;
    @Value("${gemini.api.temperature:0.2}")            private double temperature;
    @Value("${gemini.api.top-p:0.8}")                  private double topP;
    @Value("${gemini.api.candidate-count:1}")          private int candidateCount;
    @Value("${gemini.api.stop-sequences:```,\\n\\nEND}")
    private String stopSequencesRaw;

    // Retry/backoff
    @Value("${gemini.api.retry.max-attempts:4}")         private int retryMaxAttempts;
    @Value("${gemini.api.retry.initial-backoff-ms:400}")  private long retryInitialMs;
    @Value("${gemini.api.retry.max-backoff-ms:4000}")     private long retryMaxMs;
    @Value("${gemini.api.retry.jitter:true}")             private boolean retryJitter;

    // Business limits
    @Value("${limits.max-questions:10}")               private int maxQuestions;
    @Value("${limits.max-topic-chars:300}")            private int maxTopicChars;

    public GeminiServiceImpl(WebClient geminiWebClient, ObjectMapper mapper) {
        this.geminiWebClient = geminiWebClient;
        this.mapper = mapper;
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
            case TRUE_FALSE -> "Sinh đúng 2 lựa chọn: \"True\" và \"False\". Chỉ một lựa chọn correct=true.";
            case SINGLE_CHOICE -> "Sinh 1 đáp án đúng và 3 đáp án nhiễu (tổng 4). Chỉ 1 lựa chọn correct=true.";
            case MULTIPLE_CHOICE -> "Sinh tổng 4 lựa chọn, có từ 2 đến 3 đáp án correct=true.";
            default -> "Nếu loại không xác định, mặc định SINGLE_CHOICE.";
        };

        String prompt = """
                RESPOND ONLY WITH VALID JSON. DO NOT INCLUDE ANY OTHER TEXT OR EXPLANATIONS.
                
                Generate options for this question in the following format:
                { "options": [ { "optionText": "string", "correct": true|false, "correctAnswer": "string" } ] }
                
                Question: "%s"
                Type: %s | Points: %d | Time: %d seconds
                Rules: %s
                
                The "correctAnswer" field should contain the exact text of all correct options (multiple answers joined by "; ").
                Start your response immediately with { and end with }
                """.formatted(
                Optional.ofNullable(request.getQuestionText()).orElse(""),
                qType.name(), request.getPoints(), request.getTimeLimit(), rulesByType
        );

        String raw = callGemini(prompt);

        try {
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

        } catch (Exception e) {
            throw new RuntimeException("Lỗi parse phản hồi Gemini: " + e.getMessage() + " | Raw response: " + raw, e);
        }
    }

    @Override
    public List<QuestionRequestDTO> generateQuestionsByTopic(TopicGenerateRequest req) throws Exception {
        final var lang = (req.getLanguage() == null || req.getLanguage().isBlank()) ? "vi" : req.getLanguage();
        int count = (req.getCount() == null || req.getCount() < 1) ? 5 : Math.min(req.getCount(), maxQuestions);

        String topic = Optional.ofNullable(req.getTopic()).orElse("");
        if (topic.length() > maxTopicChars) {
            topic = topic.substring(0, maxTopicChars);
        }

        final var qTypeStr = (req.getQuestionType() == null) ? "AUTO" : req.getQuestionType().trim().toUpperCase(Locale.ROOT);
        // Đổi fallback mặc định 60s cho đồng bộ
        final var timeLimit = (req.getTimeLimit() == null || req.getTimeLimit() <= 0) ? 60 : req.getTimeLimit();
        final var points = (req.getPoints() == null || req.getPoints() <= 0) ? 1000 : req.getPoints();

        String rulesByType = """
                - TRUE_FALSE: exactly 2 options "True"/"False", only 1 correct.
                - SINGLE_CHOICE: 4 options, exactly 1 correct.
                - MULTIPLE_CHOICE: 4 options, 2-3 correct.
                """;

        String localeNote = lang.equalsIgnoreCase("en")
                ? "Write everything in English."
                : "Viết toàn bộ nội dung bằng tiếng Việt, ngắn gọn, rõ nghĩa, phù hợp kiểm tra kiến thức.";

        String prompt = """
                RESPOND ONLY WITH VALID JSON. DO NOT INCLUDE ANY OTHER TEXT OR EXPLANATIONS.
                
                %s
                Generate exactly %d questions about the topic: "%s"
                
                Use this JSON format:
                {
                  "questions": [
                    {
                      "questionText": "string",
                      "questionType": "TRUE_FALSE | SINGLE_CHOICE | MULTIPLE_CHOICE",
                      "timeLimit": %d,
                      "points": %d,
                      "options": [
                        { "optionText": "string", "correct": true|false, "correctAnswer": "string" }
                      ]
                    }
                  ]
                }
                
                Rules: %s
                Question type preference: "%s" (if "AUTO", choose appropriate type per question)
                
                The "correctAnswer" field should contain the exact text of all correct options (multiple answers joined by "; ").
                Start your response immediately with { and end with }
                """.formatted(localeNote, count, topic, timeLimit, points, rulesByType, qTypeStr);

        String raw = callGemini(prompt);

        try {
            String jsonText = extractJsonText(raw);
            JsonNode json = mapper.readTree(jsonText);

            List<QuestionRequestDTO> out = new ArrayList<>();
            if (json.has("questions") && json.get("questions").isArray()) {
                for (JsonNode q : json.get("questions")) {
                    var dto = new QuestionRequestDTO();
                    dto.setQuizId(null);
                    dto.setQuestionText(q.path("questionText").asText(""));

                    String typeFromAi = q.path("questionType").asText("");
                    String finalType = !"AUTO".equals(qTypeStr) ? qTypeStr : typeFromAi;
                    dto.setQuestionType(
                            (finalType == null || finalType.isBlank()) ? "SINGLE_CHOICE" : finalType.toUpperCase(Locale.ROOT)
                    );

                    dto.setTimeLimit(timeLimit);
                    dto.setPoints(points);

                    List<OptionRequestDTO> options = new ArrayList<>();
                    if (q.has("options") && q.get("options").isArray()) {
                        for (JsonNode op : q.get("options")) {
                            var o = new OptionRequestDTO();
                            o.setOptionId(UUID.randomUUID());
                            o.setOptionText(op.path("optionText").asText(""));
                            o.setCorrect(op.path("correct").asBoolean(false));
                            o.setCorrectAnswer(op.path("correctAnswer").asText(""));
                            options.add(o);
                        }
                    }
                    var normalized = postValidateAndNormalize(options, safeParseType(dto.getQuestionType()));
                    dto.setOptions(normalized);
                    out.add(dto);
                }
            }
            return out;

        } catch (Exception e) {
            throw new RuntimeException("Lỗi parse phản hồi Gemini: " + e.getMessage() + " | Raw response: " + raw, e);
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

            // Validate that we got a complete response
            try {
                String jsonText = extractJsonText(response);
                // Try to parse to validate it's complete JSON
                mapper.readTree(jsonText);
                return response; // Success
            } catch (Exception e) {
                if (e.getMessage() != null && e.getMessage().contains("incomplete response")) {
                    System.err.println("[Gemini] Attempt " + (attemptCount + 1) + " returned incomplete response, retrying...");
                    // Modify prompt to be even more direct
                    String modifiedPrompt = "JSON ONLY - NO OTHER TEXT:\n" + prompt;
                    return callGeminiWithRetry(modifiedPrompt, attemptCount + 1);
                }
                throw e;
            }

        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("incomplete response") && attemptCount < 2) {
                System.err.println("[Gemini] Attempt " + (attemptCount + 1) + " failed with incomplete response, retrying...");
                // Try with a simplified, more direct prompt
                String simplifiedPrompt = "Return only JSON: " + prompt;
                return callGeminiWithRetry(simplifiedPrompt, attemptCount + 1);
            }
            throw e;
        }
    }

    private com.fasterxml.jackson.databind.node.ObjectNode buildGenConfig() {
        var genCfg = mapper.createObjectNode();
        genCfg.put("response_mime_type", "application/json");
        genCfg.put("maxOutputTokens", maxOutputTokens);
        genCfg.put("temperature", temperature);
        genCfg.put("topP", topP);
        genCfg.put("candidateCount", candidateCount);

        // Remove problematic stop sequences that might interfere with JSON generation
        // Only add stop sequences if they don't conflict with JSON format
        var stopArr = mapper.createArrayNode();
        for (String s : stopSequencesRaw.split(",")) {
            String trimmed = s.replace("\\n", "\n").trim();
            // Skip stop sequences that might interfere with JSON
            if (!trimmed.isEmpty() &&
                    !trimmed.contains("{") &&
                    !trimmed.contains("}") &&
                    !trimmed.contains("[") &&
                    !trimmed.contains("]") &&
                    !trimmed.equals("```")) {
                stopArr.add(trimmed);
            }
        }
        if (stopArr.size() > 0) genCfg.set("stopSequences", stopArr);

        return genCfg;
    }

    private String modelUrl() {
        return "/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
    }

    // =========================================================
    // =============== Helpers =================================
    // =========================================================

    private String extractJsonText(String raw) throws Exception {
        JsonNode root = mapper.readTree(raw);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.size() == 0) {
            throw new RuntimeException("Gemini không trả về candidates: " + raw);
        }

        JsonNode candidate = candidates.get(0);
        String finishReason = candidate.path("finishReason").asText();

        // Check for various completion reasons
        if ("MAX_TOKENS".equalsIgnoreCase(finishReason)) {
            throw new RuntimeException("Gemini bị cắt do vượt maxOutputTokens. Hãy tăng config gemini.api.max-output-tokens.");
        }

        // Log finish reason for debugging
        if (!"STOP".equalsIgnoreCase(finishReason)) {
            System.err.println("[GEMINI] Warning: Unusual finish reason: " + finishReason);
        }

        JsonNode parts = candidate.path("content").path("parts");
        if (!parts.isArray() || parts.size() == 0) {
            throw new RuntimeException("Gemini không trả về parts: " + raw);
        }

        String text = parts.get(0).path("text").asText();
        if (text.isBlank()) {
            throw new RuntimeException("Gemini trả về text rỗng: " + raw);
        }

        // Check if response is incomplete (common signs)
        String trimmed = text.trim();
        if (trimmed.toLowerCase().startsWith("here is") ||
                trimmed.toLowerCase().startsWith("here's") ||
                trimmed.endsWith(":") ||
                (!trimmed.contains("{") && !trimmed.contains("["))) {

            // Try to make another call with a more direct prompt
            throw new RuntimeException("Gemini returned incomplete response: " + text + ". This might be due to content filtering or prompt issues.");
        }

        // Enhanced JSON extraction with better error handling
        return sanitizeToJson(text);
    }

    private String sanitizeToJson(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new RuntimeException("Raw text is null or empty");
        }

        String trimmed = rawText.trim();

        // If the response already starts with { or [, try to use it directly
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            // Find the matching closing brace/bracket
            if (trimmed.startsWith("{")) {
                int braceCount = 0;
                int endIndex = -1;
                for (int i = 0; i < trimmed.length(); i++) {
                    char c = trimmed.charAt(i);
                    if (c == '{') braceCount++;
                    else if (c == '}') {
                        braceCount--;
                        if (braceCount == 0) {
                            endIndex = i + 1;
                            break;
                        }
                    }
                }
                if (endIndex > 0) {
                    return trimmed.substring(0, endIndex);
                }
            } else if (trimmed.startsWith("[")) {
                int bracketCount = 0;
                int endIndex = -1;
                for (int i = 0; i < trimmed.length(); i++) {
                    char c = trimmed.charAt(i);
                    if (c == '[') bracketCount++;
                    else if (c == ']') {
                        bracketCount--;
                        if (bracketCount == 0) {
                            endIndex = i + 1;
                            break;
                        }
                    }
                }
                if (endIndex > 0) {
                    return trimmed.substring(0, endIndex);
                }
            }
        }

        // Remove common markdown code block markers
        trimmed = trimmed.replaceAll("^```json\\s*", "").replaceAll("```\\s*$", "");
        trimmed = trimmed.replaceAll("^```\\s*", "").replaceAll("```\\s*$", "");

        // Try regex patterns for JSON objects and arrays
        Pattern objectPattern = Pattern.compile("\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}", Pattern.DOTALL);
        Matcher objectMatcher = objectPattern.matcher(trimmed);
        if (objectMatcher.find()) {
            return objectMatcher.group();
        }

        Pattern arrayPattern = Pattern.compile("\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\][^\\[\\]]*)*\\]", Pattern.DOTALL);
        Matcher arrayMatcher = arrayPattern.matcher(trimmed);
        if (arrayMatcher.find()) {
            return arrayMatcher.group();
        }

        // More aggressive JSON extraction - look for the first { to the last }
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }

        // Same for arrays
        int firstBracket = trimmed.indexOf('[');
        int lastBracket = trimmed.lastIndexOf(']');
        if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket) {
            return trimmed.substring(firstBracket, lastBracket + 1);
        }

        // If all else fails, throw an exception with the raw text for debugging
        throw new RuntimeException("Could not extract valid JSON from response. Raw text: " + trimmed);
    }

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
            default -> {}
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
}
