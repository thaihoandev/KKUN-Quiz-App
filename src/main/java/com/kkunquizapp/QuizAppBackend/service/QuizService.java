package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.UUID;

public interface QuizService {
    List<QuizResponseDTO> getAllQuizzes();
    QuizResponseDTO getQuizById(UUID quizId);
    List<QuizResponseDTO> getQuizzesByUser(UUID userId);
    QuizResponseDTO createQuiz(HttpServletRequest request, QuizRequestDTO quizRequestDTO);
    QuizResponseDTO updateQuiz(UUID quizId, QuizRequestDTO quizRequestDTO);
    QuizResponseDTO deleteQuiz(UUID quizId);
    void addViewerByEmail(UUID quizId, String email);
    void addEditorByEmail(UUID quizId,String email);
}
