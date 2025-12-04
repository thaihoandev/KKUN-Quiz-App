package com.kkunquizapp.QuizAppBackend.question.service;

import com.kkunquizapp.QuizAppBackend.question.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface QuestionService {

    // CREATE
    QuestionResponseDTO addQuestion(QuestionRequestDTO request, UUID userId);
    List<QuestionResponseDTO> addQuestions(List<QuestionRequestDTO> requests, UUID userId);

    // READ
    QuestionResponseDTO getQuestionById(UUID questionId);
    Page<QuestionResponseDTO> getQuestionsByQuiz(UUID quizId, Pageable pageable);
    Page<QuestionResponseDTO> searchQuestions(String keyword, String questionType, String difficulty, Pageable pageable);
    List<QuestionResponseDTO> getQuestionsByTag(String tag);
    List<QuestionResponseDTO> getFavoriteQuestions(UUID userId);

    // UPDATE
    QuestionResponseDTO updateQuestion(UUID questionId, QuestionUpdateRequest request, UUID userId);

    // DELETE
    void softDeleteQuestion(UUID questionId, UUID userId);
    void hardDeleteQuestion(UUID questionId);
    void restoreQuestion(UUID questionId, UUID userId);

    // DUPLICATE
    QuestionResponseDTO duplicateQuestion(UUID sourceQuestionId, UUID targetQuizId, UUID userId);
    List<QuestionResponseDTO> duplicateQuestionsFromQuiz(UUID sourceQuizId, UUID targetQuizId, UUID userId);

    // BULK IMPORT/EXPORT
    BulkQuestionImportResponse importQuestionsFromCSV(MultipartFile file, UUID quizId, UUID userId);
    byte[] exportQuestionsAsCSV(UUID quizId);

    // ANALYTICS
    QuestionAnalyticsDTO getQuestionAnalytics(UUID questionId);

    // FAVORITES
    void markAsFavorite(UUID questionId, UUID userId);
    void unmarkAsFavorite(UUID questionId, UUID userId);
}
