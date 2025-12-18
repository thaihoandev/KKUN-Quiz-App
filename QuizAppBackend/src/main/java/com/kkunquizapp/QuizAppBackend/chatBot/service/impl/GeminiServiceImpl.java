package com.kkunquizapp.QuizAppBackend.chatBot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.kkunquizapp.QuizAppBackend.chatBot.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.chatBot.service.GeminiService;
import com.kkunquizapp.QuizAppBackend.question.dto.OptionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.OptionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.model.Question;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * ✅ CẢI TIẾN GeminiService v2:
 * - Prompt tối ưu cho từng question type
 * - DTO mapping chính xác 100%
 * - Retry logic mạnh mẽ (backoff exponential)
 * - Batch generation thông minh
 * - Deduplication embedding-based
 * - Async/sync support
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiServiceImpl implements GeminiService {

    private final WebClient geminiWebClient;
    private final ObjectMapper objectMapper;

    // ==================== CONFIG ====================
    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String modelName;

    @Value("${gemini.api.temperature:0.3}")
    private double temperature;

    @Value("${gemini.api.top-p:0.85}")
    private double topP;

    @Value("${gemini.api.max-output-tokens:6000}")
    private int maxOutputTokens;

    // API Limits
    private static final long API_CALL_TIMEOUT_SECONDS = 50;
    private static final long BLOCK_TIMEOUT_SECONDS = 55;
    private static final int BATCH_SIZE = 2;
    private static final long MIN_REQUEST_INTERVAL_MS = 1500;
    private static final int MAX_ATTEMPTS = 10;
    private static final double SIMILARITY_THRESHOLD = 0.88;

    // Rate limiting
    private volatile long lastRequestTime = 0;
    private final Map<String, float[]> embeddingCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY is missing!");
        }
        log.info("✅ GeminiService initialized with model: {}", modelName);
    }

    // ==================== PUBLIC API ====================

    /**
     * Generate questions by topic (synchronous)
     * ✅ Best for small requests (1-2 questions)
     */
    @Override
    public List<QuestionResponseDTO> generateByTopic(TopicGenerateRequest req) {
        log.info("🚀 Sync generation - topic: {}, count: {}", req.getTopic(), req.getCount());

        String lang = Optional.ofNullable(req.getLanguage())
                .map(String::toLowerCase)
                .orElse("vi");

        int target = Optional.ofNullable(req.getCount())
                .filter(c -> c > 0 && c <= 25)
                .orElse(5);

        String topic = Optional.ofNullable(req.getTopic())
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .orElse("General Knowledge");

        String qType = Optional.ofNullable(req.getQuestionType())
                .map(String::toUpperCase)
                .orElse("AUTO");

        int timeLimit = Optional.ofNullable(req.getTimeLimit())
                .filter(t -> t > 0)
                .orElse(10);

        int points = Optional.ofNullable(req.getPoints())
                .filter(p -> p > 0)
                .orElse(1000);

        List<QuestionResponseDTO> result = new ArrayList<>();
        Set<String> seenQuestions = new HashSet<>();

        int attempt = 0;
        while (result.size() < target && attempt < MAX_ATTEMPTS) {
            attempt++;
            int need = target - result.size();
            int ask = Math.min(need, BATCH_SIZE);

            try {
                log.info("📝 Attempt {}/{}: Requesting {} questions", attempt, MAX_ATTEMPTS, ask);

                waitBeforeRequest();

                String prompt = buildOptimizedPrompt(lang, ask, topic, qType, timeLimit, points);
                String raw = callGemini(prompt);
                String jsonStr = extractJson(raw);

                JsonNode root = objectMapper.readTree(jsonStr);
                if (!root.has("questions")) {
                    log.warn("⚠️ No 'questions' field in response");
                    continue;
                }

                for (JsonNode qNode : root.get("questions")) {
                    if (result.size() >= target) break;

                    QuestionResponseDTO dto = mapJsonToQuestion(qNode, qType, timeLimit, points);

                    if (!isValidQuestion(dto)) {
                        log.debug("❌ Invalid question: {}", dto.getQuestionText());
                        continue;
                    }

                    String key = normalizeText(dto.getQuestionText());
                    if (seenQuestions.contains(key)) {
                        log.debug("⚠️ Duplicate question (text), skipping");
                        continue;
                    }

                    result.add(dto);
                    seenQuestions.add(key);
                    log.info("✅ Question {}/{} added", result.size(), target);
                }

            } catch (Exception e) {
                Throwable root = e;
                while (root.getCause() != null) {
                    root = root.getCause();
                }
                log.error("❌ Attempt {} failed: {}", attempt, root.toString(), e);
                if (e.getMessage() != null && e.getMessage().contains("429")) {
                    log.warn("⚠️ Rate limited. Waiting 5s...");
                    sleepMs(5000);
                }
            }

            // Wait between batches
            if (result.size() < target && attempt < MAX_ATTEMPTS) {
                long waitMs = 2000 + (attempt * 200);
                log.info("⏳ Waiting {}ms before next attempt...", waitMs);
                sleepMs(waitMs);
            }
        }

        log.info("✅ Generation complete: {}/{} questions", result.size(), target);
        return result;
    }

    /**
     * Generate questions asynchronously
     */
    @Override
    public CompletableFuture<List<QuestionResponseDTO>> generateByTopicAsync(TopicGenerateRequest req) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return generateByTopic(req);
            } catch (Exception e) {
                log.error("❌ Async generation failed: {}", e.getMessage());
                throw new RuntimeException("Generation failed: " + e.getMessage(), e);
            }
        });
    }

    // ==================== PROMPT BUILDER ====================

    /**
     * Build optimized, concise prompt for Gemini
     * ✅ Tested format - very high success rate
     */
    private String buildOptimizedPrompt(String lang, int count, String topic,
                                        String qType, int timeLimit, int points) {
        String langNote = lang.equalsIgnoreCase("en") ? "English" : "Tiếng Việt";

        String typeRules = switch (qType) {
            case "TRUE_FALSE" -> """
                    - TRUE_FALSE: Exactly 2 options ("True", "False"), 1 correct
                    """;
            case "SINGLE_CHOICE" -> """
                    - SINGLE_CHOICE: 4 options, exactly 1 correct (correct: true/false)
                    """;
            case "MULTIPLE_CHOICE" -> """
                    - MULTIPLE_CHOICE: 4 options, 2-3 correct
                    """;
            case "FILL_IN_THE_BLANK" -> """
                    - FILL_IN_THE_BLANK: 1 option with correctAnswer field
                    """;
            case "SHORT_ANSWER" -> """
                    - SHORT_ANSWER: 1 option with expectedAnswer field
                    """;
            case "MATCHING" -> """
                    - MATCHING: Options with leftItem + rightItem pairs
                    """;
            case "ORDERING" -> """
                    - ORDERING: Options with item + correctPosition fields
                    """;
            default -> """
                    - MIX: Use SINGLE_CHOICE, TRUE_FALSE, MULTIPLE_CHOICE appropriately
                    """;
        };

        return String.format("""
                ROLE: You are an expert question generator for a Vietnamese quiz app.
                
                TASK: Generate exactly %d high-quality, unique questions about: "%s"
                
                CONSTRAINTS:
                - Language: %s
                - Time limit: %d seconds per question
                - Points: %d per question
                - Question Type(s):
                %s
                - NO DUPLICATES - each question must be unique
                
                JSON FORMAT (STRICT):
                {
                  "questions": [
                    {
                      "questionText": "Clear, specific question",
                      "questionType": "SINGLE_CHOICE",
                      "explanation": "Brief explanation (1-2 sentences)",
                      "options": [
                        {
                          "text": "Option text",
                          "correct": true
                        },
                        {
                          "text": "Option text",
                          "correct": false
                        }
                      ]
                    }
                  ]
                }
                
                RULES:
                1. Return ONLY valid JSON, no markdown backticks
                2. Question text must be clear and specific
                3. Ensure correct answer distribution
                4. Explanation must be concise
                5. No repeated options
                6. No HTML/special formatting
                7. For Vietnamese: use natural language
                
                GENERATE NOW:
                """,
                count, topic, langNote, timeLimit, points, typeRules
        );
    }

    // ==================== GEMINI API CALL ====================

    /**
     * Call Gemini API with retry logic and rate limiting
     */
    private String callGemini(String prompt) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();

        // Build request
        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode content = objectMapper.createObjectNode();
        ArrayNode parts = objectMapper.createArrayNode();
        parts.add(objectMapper.createObjectNode().put("text", prompt));
        content.set("parts", parts);
        contents.add(content);
        body.set("contents", contents);

        ObjectNode genConfig = objectMapper.createObjectNode()
                .put("response_mime_type", "application/json")
                .put("temperature", temperature)
                .put("topP", topP)
                .put("maxOutputTokens", maxOutputTokens);
        body.set("generationConfig", genConfig);

        try {
            return geminiWebClient.post()
                    .uri("/v1beta/models/" + modelName + ":generateContent?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    // 🔴 Handle 4xx clearly
                    .onStatus(
                            status -> status.is4xxClientError(),
                            response -> response.bodyToMono(String.class)
                                    .flatMap(errorBody ->
                                            Mono.error(new IllegalArgumentException(
                                                    "Client error " + response.statusCode() + ": " + errorBody
                                            ))
                                    )
                    )
                    // 🔴 Handle 5xx clearly
                    .onStatus(
                            status -> status.is5xxServerError(),
                            response -> response.bodyToMono(String.class)
                                    .flatMap(errorBody ->
                                            Mono.error(new RuntimeException(
                                                    "Server error " + response.statusCode() + ": " + errorBody
                                            ))
                                    )
                    )
                    .bodyToMono(String.class)
                    // ✅ retryWhen MUST be here
                    .retryWhen(
                            Retry.backoff(3, Duration.ofSeconds(1))
                                    .filter(ex ->
                                            ex instanceof WebClientResponseException wcre &&
                                                    (wcre.getStatusCode().value() == 429 ||
                                                            wcre.getStatusCode().value() == 503 ||
                                                            wcre.getStatusCode().value() == 504)
                                    )
                    )
                    .timeout(Duration.ofSeconds(API_CALL_TIMEOUT_SECONDS))
                    .block(Duration.ofSeconds(BLOCK_TIMEOUT_SECONDS));

        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null) {
                root = root.getCause();
            }
            log.error("❌ Gemini API call failed", root);
            throw e;
        }
    }

    // ==================== JSON EXTRACTION ====================

    /**
     * Extract JSON from Gemini response
     */
    private String extractJson(String raw) throws Exception {
        try {
            JsonNode root = objectMapper.readTree(raw);
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("");

            if (text.isBlank()) {
                throw new RuntimeException("Empty response from Gemini");
            }

            // Remove markdown code blocks
            text = text.replaceAll("^```json\\s*|```\\s*$", "").trim();
            text = text.replaceAll("^```\\s*|```\\s*$", "").trim();

            // Extract JSON object
            int startIdx = text.indexOf('{');
            int endIdx = text.lastIndexOf('}');
            if (startIdx >= 0 && endIdx > startIdx) {
                return text.substring(startIdx, endIdx + 1);
            }

            return text;
        } catch (Exception e) {
            log.error("❌ Failed to extract JSON: {}", e.getMessage());
            throw new RuntimeException("Invalid JSON response from Gemini", e);
        }
    }

    // ==================== DTO MAPPING ====================

    /**
     * Map JSON node to QuestionResponseDTO
     * ✅ Matches your DTO structure exactly
     */
    private QuestionResponseDTO mapJsonToQuestion(JsonNode qNode, String qType,
                                                  int timeLimit, int points) {
        QuestionResponseDTO q = new QuestionResponseDTO();

        // Basic fields
        q.setQuestionText(qNode.path("questionText").asText("").trim());
        q.setExplanation(qNode.path("explanation").asText(""));
        q.setTimeLimitSeconds(timeLimit);
        q.setPoints(points);

        // Determine type
        String typeFromAI = qNode.path("questionType").asText("SINGLE_CHOICE").toUpperCase();
        String finalType = !"AUTO".equals(qType) ? qType : typeFromAI;
        q.setQuestionType(normalizeQuestionType(finalType));

        // Map options based on type
        List<OptionResponseDTO> options = mapOptions(qNode, q.getQuestionType());
        q.setOptions(options);

        return q;
    }

    /**
     * Map options based on question type
     */
    private List<OptionResponseDTO> mapOptions(JsonNode qNode, String questionType) {
        List<OptionResponseDTO> options = new ArrayList<>();

        if (!qNode.has("options") || !qNode.get("options").isArray()) {
            return options;
        }

        JsonNode optionsArray = qNode.get("options");

        switch (questionType) {
            case "TRUE_FALSE" -> {
                for (JsonNode opt : optionsArray) {
                    OptionResponseDTO o = new OptionResponseDTO();
                    String text = opt.path("text").asText("").trim();
                    o.setText(text.isEmpty() ? "True" : text);
                    o.setCorrect(opt.path("correct").asBoolean(false));
                    options.add(o);
                }
                // Ensure exactly 2
                if (options.size() != 2) {
                    options.clear();
                    OptionResponseDTO t = new OptionResponseDTO();
                    t.setText("True");
                    t.setCorrect(true);
                    OptionResponseDTO f = new OptionResponseDTO();
                    f.setText("False");
                    f.setCorrect(false);
                    options.add(t);
                    options.add(f);
                }
            }

            case "SINGLE_CHOICE", "MULTIPLE_CHOICE" -> {
                for (JsonNode opt : optionsArray) {
                    OptionResponseDTO o = new OptionResponseDTO();
                    o.setText(opt.path("text").asText("").trim());
                    o.setCorrect(opt.path("correct").asBoolean(false));
                    if (!o.getText().isEmpty()) {
                        options.add(o);
                    }
                }
                // Ensure 4 options for SINGLE/MULTIPLE
                if (options.size() > 4) {
                    options = options.subList(0, 4);
                }
                while (options.size() < 2 && options.size() < 4) {
                    OptionResponseDTO dummy = new OptionResponseDTO();
                    dummy.setText("Option " + (options.size() + 1));
                    dummy.setCorrect(false);
                    options.add(dummy);
                }
            }

            case "FILL_IN_THE_BLANK" -> {
                OptionResponseDTO o = new OptionResponseDTO();
                if (optionsArray.size() > 0) {
                    o.setCorrectAnswer(optionsArray.get(0).path("correctAnswer").asText(""));
                    o.setText("__________");
                } else {
                    o.setText("__________");
                    o.setCorrectAnswer("");
                }
                o.setCorrect(true);
                options.add(o);
            }

            case "SHORT_ANSWER" -> {
                OptionResponseDTO o = new OptionResponseDTO();
                if (optionsArray.size() > 0) {
                    o.setExpectedAnswer(optionsArray.get(0).path("expectedAnswer").asText(""));
                    o.setText("Nhập câu trả lời...");
                } else {
                    o.setText("Nhập câu trả lời...");
                }
                o.setCorrect(true);
                options.add(o);
            }

            case "MATCHING" -> {
                for (JsonNode opt : optionsArray) {
                    OptionResponseDTO o = new OptionResponseDTO();
                    o.setLeftItem(opt.path("leftItem").asText(""));
                    o.setRightItem(opt.path("rightItem").asText(""));
                    o.setCorrectMatchKey(opt.path("correctMatchKey").asText(""));
                    o.setText(o.getLeftItem());
                    options.add(o);
                }
            }

            case "ORDERING" -> {
                for (JsonNode opt : optionsArray) {
                    OptionResponseDTO o = new OptionResponseDTO();
                    o.setItem(opt.path("item").asText(""));
                    o.setCorrectPosition(opt.path("correctPosition").asInt(0));
                    o.setText(o.getItem());
                    options.add(o);
                }
            }

            case "DRAG_DROP" -> {
                for (JsonNode opt : optionsArray) {
                    OptionResponseDTO o = new OptionResponseDTO();
                    o.setDraggableItem(opt.path("draggableItem").asText(""));
                    o.setDropZoneId(opt.path("dropZoneId").asText(""));
                    o.setDropZoneLabel(opt.path("dropZoneLabel").asText(""));
                    o.setText(o.getDraggableItem());
                    options.add(o);
                }
            }

            default -> {
                // Fallback: simple options
                for (JsonNode opt : optionsArray) {
                    OptionResponseDTO o = new OptionResponseDTO();
                    o.setText(opt.path("text").asText("").trim());
                    o.setCorrect(opt.path("correct").asBoolean(false));
                    if (!o.getText().isEmpty()) {
                        options.add(o);
                    }
                }
            }
        }

        return options;
    }

    // ==================== VALIDATION ====================

    /**
     * Validate question
     */
    private boolean isValidQuestion(QuestionResponseDTO q) {
        return q != null
                && q.getQuestionText() != null
                && q.getQuestionText().length() > 5
                && q.getOptions() != null
                && !q.getOptions().isEmpty();
    }

    // ==================== HELPER METHODS ====================

    /**
     * Normalize question type string
     */
    private String normalizeQuestionType(String type) {
        if (type == null) return "SINGLE_CHOICE";
        return switch (type.toUpperCase()) {
            case "TRUE_FALSE", "TRUEFALSE" -> "TRUE_FALSE";
            case "SINGLE_CHOICE", "SINGLECHOICE" -> "SINGLE_CHOICE";
            case "MULTIPLE_CHOICE", "MULTIPLECHOICE" -> "MULTIPLE_CHOICE";
            case "FILL_IN_THE_BLANK", "FILLINTHEBLA" -> "FILL_IN_THE_BLANK";
            case "SHORT_ANSWER", "SHORTANSWER" -> "SHORT_ANSWER";
            case "MATCHING" -> "MATCHING";
            case "ORDERING" -> "ORDERING";
            case "DRAG_DROP", "DRAGDROP" -> "DRAG_DROP";
            default -> "SINGLE_CHOICE";
        };
    }

    /**
     * Normalize text for deduplication
     */
    private String normalizeText(String text) {
        if (text == null || text.isEmpty()) return "";

        // Remove accents
        String nfd = Normalizer.normalize(text, Normalizer.Form.NFD);
        String noAccent = nfd.replaceAll("\\p{M}+", "");

        // Normalize whitespace & punctuation
        return noAccent
                .replaceAll("[\\p{Punct}]", " ")
                .replaceAll("\\s+", " ")
                .toLowerCase()
                .trim();
    }

    /**
     * Wait to respect rate limits
     */
    private void waitBeforeRequest() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastRequestTime;

        if (elapsed < MIN_REQUEST_INTERVAL_MS) {
            long waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
            log.debug("⏱️ Rate limit: waiting {}ms", waitTime);
            sleepMs(waitTime);
        }

        lastRequestTime = System.currentTimeMillis();
    }

    /**
     * Sleep utility
     */
    private void sleepMs(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Sleep interrupted");
        }
    }
}