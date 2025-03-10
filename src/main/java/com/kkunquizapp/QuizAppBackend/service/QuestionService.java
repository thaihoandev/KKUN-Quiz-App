package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;

import java.util.List;
import java.util.UUID;

public interface QuestionService {
    QuestionResponseDTO addQuestion(QuestionRequestDTO questionRequestDTO);
    QuestionResponseDTO getQuestionById(UUID questionId);
    QuestionResponseDTO updateQuestion(UUID questionId, QuestionRequestDTO questionRequestDTO);
    QuestionResponseDTO softDeleteQuestion(UUID questionId);
    List<QuestionResponseDTO> getQuestionsByQuizId(UUID quizId);
    void deleteQuestion(UUID questionId);

}
