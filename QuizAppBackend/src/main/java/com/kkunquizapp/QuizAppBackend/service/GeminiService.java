package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.TopicGenerateRequest;

import java.util.List;

public interface GeminiService {
    QuestionRequestDTO generateOptionsForQuestion(QuestionRequestDTO request) throws Exception;

    // NEW: Sinh nhiều câu hỏi theo chủ đề
    List<QuestionRequestDTO> generateQuestionsByTopic(TopicGenerateRequest req) throws Exception;
}
