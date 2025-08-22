package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.QuizStatus;
import jakarta.servlet.http.HttpServletRequest;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface QuizService {
    Page<QuizResponseDTO> getAllQuizzes(Pageable pageable);
    QuizResponseDTO getQuizById(UUID quizId);
    Page<QuizResponseDTO> getQuizzesByUser(UUID userId, Pageable pageable, QuizStatus quizStatus);
    QuizResponseDTO createQuiz(HttpServletRequest request, QuizRequestDTO quizRequestDTO);
    QuizResponseDTO updateQuiz(UUID quizId, QuizRequestDTO quizRequestDTO);
    QuizResponseDTO publishedQuiz(UUID quizId);
    QuizResponseDTO deleteQuiz(UUID quizId);
    void addViewerByEmail(UUID quizId, String email);
    void addEditorByEmail(UUID quizId, String email);

    Page<QuizResponseDTO> getPublishedQuizzes(Pageable pageable);
    QuizResponseDTO saveForCurrentUser(HttpServletRequest request, UUID quizId);

}
