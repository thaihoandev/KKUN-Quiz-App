package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;
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

}
