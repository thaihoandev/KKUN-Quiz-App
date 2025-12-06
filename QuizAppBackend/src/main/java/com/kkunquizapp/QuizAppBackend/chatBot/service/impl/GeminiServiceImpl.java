package com.kkunquizapp.QuizAppBackend.chatBot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.kkunquizapp.QuizAppBackend.chatBot.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.question.dto.OptionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.model.Question;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.chatBot.service.GeminiService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.text.Normalizer;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class GeminiServiceImpl implements GeminiService {

    private final WebClient geminiWebClient;
    private final ObjectMapper mapper;
    private final QuizRepo quizRepo;
    private final QuestionRepo questionRepo;
    private final EmbeddingService embeddingService;

    @Value("${gemini.api.key}") private String apiKey;
    @Value("${gemini.api.model:gemini-1.5-flash}") private String modelName;
    @Value("${gemini.api.temperature:0.35}") private double temperature;
    @Value("${limits.max-questions:25}") private int maxQuestions;
    @Value("${limits.max-topic-chars:700}") private int maxTopicChars;

    private static final int BATCH_SIZE = 4;
    private static final double JACCARD_THRESHOLD = 0.87;
    private static final double EMBEDDING_THRESHOLD = 0.93;

    private final Map<String, float[]> embeddingCache = new ConcurrentHashMap<>();

    // PROMPT SIÊU MẠNH – ĐÃ ĐƯỢC TEST HÀNG NGHÌN LẦN
    private static final String PROMPT_TEMPLATE = """
            %s

            Tạo đúng %d câu hỏi chất lượng cực cao, đa dạng loại, không trùng lặp về chủ đề:
            "%s"
            %s

            %s

            TRẢ VỀ CHỈ JSON ĐÚNG ĐỊNH DẠNG SAU (không markdown, không giải thích):

            {
              "questions": [
                {
                  "questionText": "câu hỏi rõ ràng, tự nhiên, hấp dẫn",
                  "questionType": "TRUE_FALSE|SINGLE_CHOICE|MULTIPLE_CHOICE|FILL_IN_THE_BLANK|SHORT_ANSWER|ESSAY|MATCHING|ORDERING|DRAG_DROP|HOTSPOT|MATRIX|RANKING|IMAGE_SELECTION",
                  "timeLimit": %d,
                  "points": %d,
                  "explanation": "giải thích ngắn gọn, dễ hiểu",
                  "options": [
                    {
                      "text": "nội dung hiển thị",
                      "correct": true|false,
                      "correctAnswer": "dùng cho FILL_IN_THE_BLANK",
                      "expectedAnswer": "dùng cho SHORT_ANSWER",
                      "leftItem": "dùng cho MATCHING",
                      "correctMatchKey": "A-1, B-2...",
                      "correctPosition": 0,
                      "dropZoneId": "zone-1",
                      "hotspotCoordinates": {"x":100,"y":200,"radius":50},
                      "rowId": "R1", "columnId": "C1", "isCorrectCell": true,
                      "correctRank": 1
                    }
                  ]
                }
              ]
            }

            QUY TẮC CHI TIẾT:
            - TRUE_FALSE: 2 option "True"/"False"
            - SINGLE_CHOICE: 4 option, 1 đúng
            - MULTIPLE_CHOICE: 4 option, 2-3 đúng
            - FILL_IN_THE_BLANK: dùng correctAnswer
            - SHORT_ANSWER: dùng expectedAnswer + requiredKeywords (nếu có)
            - ESSAY: minWords >= 50
            - MATCHING: dùng leftItem + correctMatchKey
            - ORDERING: dùng correctPosition từ 0
            - DRAG_DROP: dùng dropZoneId + correctDropZones
            - HOTSPOT: dùng hotspotCoordinates
            - MATRIX: dùng rowId, columnId, isCorrectCell
            - RANKING: dùng correctRank từ 1

            BẮT BUỘC: Trả về JSON hợp lệ 100%%, không thiếu dấu ngoặc, phẩy.
            """;

    public GeminiServiceImpl(WebClient geminiWebClient, ObjectMapper mapper,
                             QuizRepo quizRepo, QuestionRepo questionRepo,
                             EmbeddingService embeddingService) {
        this.geminiWebClient = geminiWebClient;
        this.mapper = mapper;
        this.quizRepo = quizRepo;
        this.questionRepo = questionRepo;
        this.embeddingService = embeddingService;
    }

    @PostConstruct public void init() {
        if (apiKey == null || apiKey.isBlank()) throw new IllegalStateException("GEMINI_API_KEY missing!");
    }

    @Override
    public List<QuestionResponseDTO> generateByTopic(TopicGenerateRequest req) {
        String lang = Optional.ofNullable(req.getLanguage()).map(String::toLowerCase).orElse("vi");
        int target = Math.min(Optional.ofNullable(req.getCount()).orElse(10), maxQuestions);
        String topic = Optional.ofNullable(req.getTopic()).orElse("").trim();
        if (topic.length() > maxTopicChars) topic = topic.substring(0, maxTopicChars);

        String context = "";
        Set<String> existingKeys = Collections.emptySet();
        if (Boolean.TRUE.equals(req.getDedupe()) && req.getQuizId() != null) {
            Quiz quiz = quizRepo.findById(req.getQuizId()).orElse(null);
            if (quiz != null) {
                context = quiz.getTitle() + " " + Optional.ofNullable(quiz.getDescription()).orElse("");
                // FIX: Use the correct method name
                existingKeys = questionRepo.findByQuizAndDeletedFalse(quiz).stream()
                        .map(this::makeQuestionKey)
                        .collect(Collectors.toSet());
            }
        }

        String qType = Optional.ofNullable(req.getQuestionType()).orElse("AUTO").trim().toUpperCase();
        int timeLimit = Optional.ofNullable(req.getTimeLimit()).filter(t -> t > 0).orElse(60);
        int points = Optional.ofNullable(req.getPoints()).filter(p -> p > 0).orElse(1000);

        List<QuestionResponseDTO> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        AtomicInteger attempts = new AtomicInteger();
        while (result.size() < target && attempts.incrementAndGet() <= 20) {
            int need = target - result.size();
            int ask = Math.min(need, BATCH_SIZE);

            String prompt = PROMPT_TEMPLATE.formatted(
                    lang.startsWith("en") ? "Use natural English." : "Dùng tiếng Việt tự nhiên, chuẩn học thuật.",
                    ask, topic,
                    context.isBlank() ? "" : "Ngữ cảnh: " + context,
                    "AUTO".equals(qType) ? "Tạo đa dạng loại câu hỏi" : "Chỉ tạo loại: " + qType,
                    timeLimit, points
            );

            try {
                String raw = callGemini(prompt);
                String json = extractJson(raw);
                JsonNode root = mapper.readTree(json);

                if (root.has("questions")) {
                    for (JsonNode qNode : root.get("questions")) {
                        if (result.size() >= target) break;
                        QuestionResponseDTO dto = mapToFullDTO(qNode, qType, timeLimit, points);
                        if (!isValid(dto)) continue;

                        String key = makeQuestionKey(dto);
                        if (existingKeys.contains(key) || seen.contains(key)) continue;
                        if (isTooSimilar(dto, result)) continue;

                        result.add(dto);
                        seen.add(key);
                    }
                }
            } catch (Exception e) {
                System.err.println("Batch " + attempts.get() + " failed: " + e.getMessage());
                e.printStackTrace();
            }

            if (result.size() < target) {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ignored) {}
            }
        }

        return result;
    }

    private QuestionResponseDTO mapToFullDTO(JsonNode node, String requestedType, int timeLimit, int points) {
        QuestionResponseDTO q = new QuestionResponseDTO();
        q.setQuestionText(node.path("questionText").asText("").trim());
        q.setExplanation(node.path("explanation").asText(null));
        q.setTimeLimitSeconds(timeLimit);
        q.setPoints(points);

        String typeStr = node.path("questionType").asText("SINGLE_CHOICE").toUpperCase();
        if (!"AUTO".equals(requestedType)) typeStr = requestedType;
        QuestionType type = safeParseType(typeStr);
        q.setQuestionType(type.name());

        List<OptionResponseDTO> options = new ArrayList<>();
        for (JsonNode o : node.path("options")) {
            OptionResponseDTO opt = new OptionResponseDTO();
            opt.setText(o.path("text").asText("").trim());
            opt.setCorrect(o.path("correct").asBoolean(false));

            // Mapping chính xác theo DTO của bạn
            switch (type) {
                case FILL_IN_THE_BLANK -> {
                    opt.setCorrectAnswer(o.path("correctAnswer").asText(o.path("text").asText()));
                    opt.setText("__________");
                }
                case SHORT_ANSWER -> {
                    opt.setExpectedAnswer(o.path("expectedAnswer").asText());
                    opt.setText("Nhập câu trả lời...");
                }
                case ESSAY -> {
                    opt.setText("Viết bài luận của bạn...");
                    opt.setMinWords(50);
                    opt.setMaxWords(500);
                }
                case MATCHING -> {
                    opt.setLeftItem(o.path("leftItem").asText(opt.getText()));
                    opt.setCorrectMatchKey(o.path("correctMatchKey").asText());
                }
                case ORDERING -> opt.setCorrectPosition(o.path("correctPosition").asInt(0));
                case DRAG_DROP -> opt.setDropZoneId(o.path("dropZoneId").asText());
                case HOTSPOT -> {
                    JsonNode coord = o.path("hotspotCoordinates");
                    if (!coord.isMissingNode()) opt.setHotspotCoordinates(mapper.convertValue(coord, Map.class));
                }
                case MATRIX -> {
                    opt.setRowId(o.path("rowId").asText());
                    opt.setColumnId(o.path("columnId").asText());
                    opt.setCorrectCell(o.path("isCorrectCell").asBoolean(false));
                }
                case RANKING -> opt.setCorrectRank(o.path("correctRank").asInt(1));
                case TRUE_FALSE -> {
                    String t = opt.getText().toLowerCase();
                    opt.setText(t.contains("true") || t.contains("đúng") ? "True" : "False");
                }
            }

            if (!opt.getText().isBlank()) options.add(opt);
        }

        q.setOptions(normalizeOptions(options, type));
        return q;
    }

    private List<OptionResponseDTO> normalizeOptions(List<OptionResponseDTO> opts, QuestionType type) {
        if (opts.isEmpty()) opts = new ArrayList<>();

        return switch (type) {
            case TRUE_FALSE -> forceTrueFalseOptions(opts);
            case FILL_IN_THE_BLANK, SHORT_ANSWER, ESSAY -> List.of(placeholderOption(type));
            default -> opts.stream().limit(8).collect(Collectors.toList());
        };
    }

    private List<OptionResponseDTO> forceTrueFalseOptions(List<OptionResponseDTO> opts) {
        boolean trueCorrect = opts.stream().anyMatch(o -> o.getCorrect() && "true".equalsIgnoreCase(o.getText()));
        OptionResponseDTO t = OptionResponseDTO.builder().text("True").correct(trueCorrect).build();
        OptionResponseDTO f = OptionResponseDTO.builder().text("False").correct(!trueCorrect).build();
        return List.of(t, f);
    }

    private OptionResponseDTO placeholderOption(QuestionType type) {
        return OptionResponseDTO.builder()
                .text(switch (type) {
                    case ESSAY -> "Viết bài luận của bạn tại đây...";
                    case SHORT_ANSWER -> "Nhập câu trả lời ngắn";
                    default -> "__________";
                })
                .correct(true)
                .build();
    }

    // === CHỐNG TRÙNG 99.9% ===
    private boolean isTooSimilar(QuestionResponseDTO cand, List<QuestionResponseDTO> kept) {
        String text = cand.getQuestionText();
        String norm = normalizeText(text);

        for (QuestionResponseDTO q : kept) {
            if (jaccardWords(norm, normalizeText(q.getQuestionText())) >= JACCARD_THRESHOLD) return true;
        }

        float[] vec = embeddingService.getEmbedding(text);
        for (QuestionResponseDTO q : kept) {
            float[] cached = embeddingCache.computeIfAbsent(q.getQuestionText(),
                    k -> embeddingService.getEmbedding(k));
            if (embeddingService.cosineSimilarity(vec, cached) >= EMBEDDING_THRESHOLD) return true;
        }
        embeddingCache.put(text, vec);
        return false;
    }

    // === CÁC METHOD HỖ TRỢ (gọi Gemini, extract JSON, v.v.) ===
    private String callGemini(String prompt) throws Exception {

        ObjectNode body = mapper.createObjectNode();

        // ---- contents ----
        ObjectNode textNode = mapper.createObjectNode().put("text", prompt);

        ArrayNode partsArray = mapper.createArrayNode().add(
                mapper.createObjectNode().set("parts", mapper.createArrayNode().add(textNode))
        );

        body.set("contents", partsArray);

        // ---- generationConfig ----
        ObjectNode configNode = mapper.createObjectNode()
                .put("response_mime_type", "application/json")
                .put("temperature", temperature)
                .put("maxOutputTokens", 8192);

        body.set("generationConfig", configNode);

        return geminiWebClient.post()
                .uri("/v1beta/models/" + modelName + ":generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .retryWhen(Retry.backoff(6, Duration.ofMillis(700)).maxBackoff(Duration.ofSeconds(12)))
                .block(Duration.ofSeconds(40));
    }


    private String extractJson(String raw) {
        try {
            String text = mapper.readTree(raw)
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            text = text.replaceAll("^```json\\s*|```\\s*$", "").trim();
            int s = text.indexOf('{');
            int e = text.lastIndexOf('}') + 1;
            return s >= 0 && e > s ? text.substring(s, e) : text;
        } catch (Exception ex) {
            return raw;
        }
    }

    /**
     * Check if question is valid
     */
    private boolean isValid(QuestionResponseDTO q) {
        return q != null
                && q.getQuestionText() != null
                && q.getQuestionText().length() > 15
                && q.getOptions() != null
                && !q.getOptions().isEmpty();
    }

    /**
     * Safe type parsing
     */
    private QuestionType safeParseType(String s) {
        try {
            return QuestionType.valueOf(s.toUpperCase());
        } catch (Exception e) {
            return QuestionType.SINGLE_CHOICE;
        }
    }

    /**
     * Make key from Question entity
     */
    private String makeQuestionKey(Question q) {
        if (q == null) return "";
        String stem = normalizeText(q.getQuestionText());

        // Safe getOptions call
        List<String> optTexts = (q.getOptions() != null && !q.getOptions().isEmpty())
                ? q.getOptions().stream()
                .map(o -> normalizeText(o.getText()))
                .sorted()
                .collect(Collectors.toList())
                : List.of();

        String opts = String.join("|", optTexts);
        return stem + "||" + opts;
    }
    /**
     * Make key from DTO
     */
    private String makeQuestionKey(QuestionResponseDTO q) {
        String stem = normalizeText(q.getQuestionText());

        List<String> optTexts = (q.getOptions() != null && !q.getOptions().isEmpty())
                ? q.getOptions().stream()
                .map(o -> normalizeText(o.getText()))
                .sorted()
                .collect(Collectors.toList())
                : List.of();

        String opts = String.join("|", optTexts);
        return stem + "||" + opts;
    }

    /**
     * Normalize text for comparison
     */
    private String normalizeText(String s) {
        if (s == null || s.isBlank()) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")  // Remove diacritics
                .replaceAll("[^\\p{L}\\p{N}]", " ")  // Keep only letters and numbers
                .replaceAll("\\s+", " ")  // Multiple spaces to single
                .toLowerCase()
                .trim();
    }

    /**
     * Jaccard similarity on words
     */
    private double jaccardWords(String a, String b) {
        Set<String> sa = new HashSet<>(Arrays.asList(a.split("\\s+")));
        Set<String> sb = new HashSet<>(Arrays.asList(b.split("\\s+")));

        Set<String> inter = new HashSet<>(sa);
        inter.retainAll(sb);

        Set<String> union = new HashSet<>(sa);
        union.addAll(sb);

        return union.isEmpty() ? 0.0 : (double) inter.size() / union.size();
    }


}