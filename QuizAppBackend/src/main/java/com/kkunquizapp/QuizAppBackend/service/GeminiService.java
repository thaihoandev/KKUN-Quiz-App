// com.kkunquizapp.QuizAppBackend.service.GeminiService
package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.TopicGenerateRequest;

import java.util.List;

public interface GeminiService {
    QuestionRequestDTO generateOptionsForQuestion(QuestionRequestDTO request) throws Exception;

    // NEW: trả về DTO cho preview (khớp Controller)
    List<QuestionResponseDTO> generateByTopic(TopicGenerateRequest req);

    // (tuỳ chọn) nếu bạn dùng ở nơi khác:
    // List<QuestionRequestDTO> generateQuestionsByTopic(TopicGenerateRequest req) throws Exception;
}
