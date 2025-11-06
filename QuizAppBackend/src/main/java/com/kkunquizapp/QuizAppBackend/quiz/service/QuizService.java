package com.kkunquizapp.QuizAppBackend.quiz.service;

import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface QuizService {

    // ------------------- READ -------------------
    Page<QuizResponseDTO> getAllQuizzes(Pageable pageable);

    Page<QuizResponseDTO> getQuizzesByUser(UUID userId, Pageable pageable, QuizStatus status);

    QuizResponseDTO getQuizById(UUID quizId);

    Page<QuizResponseDTO> getPublishedQuizzes(Pageable pageable);

    // ------------------- CREATE -------------------
    QuizResponseDTO createQuiz(UserPrincipal currentUser, QuizRequestDTO quizRequestDTO);

    // ------------------- UPDATE -------------------
    QuizResponseDTO updateQuiz(UUID quizId, QuizRequestDTO quizRequestDTO);

    QuizResponseDTO publishedQuiz(UUID quizId);

    QuizResponseDTO deleteQuiz(UUID quizId);

    // ------------------- SHARE -------------------
    void addViewerByEmail(UUID quizId, String email);

    void addEditorByEmail(UUID quizId, String email);

    // ------------------- CLONE -------------------
    QuizResponseDTO saveForCurrentUser(UserPrincipal currentUser, UUID quizId);
}
