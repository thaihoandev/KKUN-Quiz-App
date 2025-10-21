package com.kkunquizapp.QuizAppBackend.question.service;

import com.kkunquizapp.QuizAppBackend.question.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface QuestionService {
    QuestionResponseDTO addQuestion(QuestionRequestDTO questionRequestDTO);
    QuestionResponseDTO getQuestionById(UUID questionId);
    Page<QuestionResponseDTO> getQuestionsByQuizId(UUID quizId, Pageable pageable);
    QuestionResponseDTO updateQuestion(UUID questionId, QuestionRequestDTO questionRequestDTO);
    QuestionResponseDTO softDeleteQuestion(UUID questionId);
    void deleteQuestion(UUID questionId);

    // NEW: thêm nhiều câu hỏi cùng lúc
    List<QuestionResponseDTO> addQuestions(List<QuestionRequestDTO> questionRequestDTOs);
}
