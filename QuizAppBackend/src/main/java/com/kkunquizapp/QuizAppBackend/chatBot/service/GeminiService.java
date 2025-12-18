// ==================== SERVICE INTERFACE ====================
package com.kkunquizapp.QuizAppBackend.chatBot.service;

import com.kkunquizapp.QuizAppBackend.chatBot.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface GeminiService {

    /**
     * ✅ Synchronous generation (use only for small requests)
     */
    List<QuestionResponseDTO> generateByTopic(TopicGenerateRequest request);

    /**
     * ✅ Asynchronous generation (RECOMMENDED)
     * Returns CompletableFuture so it doesn't block
     */
    CompletableFuture<List<QuestionResponseDTO>> generateByTopicAsync(TopicGenerateRequest request);
}
