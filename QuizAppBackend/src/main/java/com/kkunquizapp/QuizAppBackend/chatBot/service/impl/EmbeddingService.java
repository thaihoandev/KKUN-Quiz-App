package com.kkunquizapp.QuizAppBackend.chatBot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class EmbeddingService {

    private final WebClient webClient;
    private final ObjectMapper mapper;

    @Value("${gemini.api.key}") private String apiKey;

    private static final String EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

    public EmbeddingService(WebClient.Builder webClientBuilder, ObjectMapper mapper) {
        this.webClient = webClientBuilder.build();
        this.mapper = mapper;
    }

    public float[] getEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) return new float[768];

        text = text.replace("\"", "'").trim();
        if (text.length() > 8000) text = text.substring(0, 8000);

        var body = mapper.createObjectNode()
                .set("content", mapper.createObjectNode()
                        .set("parts", mapper.createArrayNode()
                                .add(mapper.createObjectNode().put("text", text))));

        try {
            String json = webClient.post()
                    .uri(EMBED_URL + "?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(8));

            JsonNode values = mapper.readTree(json)
                    .path("embedding").path("values");

            float[] vector = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                vector[i] = (float) values.get(i).asDouble();
            }
            return vector;
        } catch (Exception e) {
            System.err.println("Embedding lỗi: " + e.getMessage());
            return new float[768];
        }
    }

    public double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length) return 0.0;
        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return normA == 0 || normB == 0 ? 0.0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}