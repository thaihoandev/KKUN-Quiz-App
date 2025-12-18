package com.kkunquizapp.QuizAppBackend.quiz.service;

import com.kkunquizapp.QuizAppBackend.quiz.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Quiz Service Interface
 * Comprehensive quiz management operations
 */
public interface QuizService {

    // ==================== CREATE ====================
    /**
     * Create a new quiz
     * @param request Quiz creation request
     * @param creatorId ID of quiz creator
     * @return Created quiz details
     */
    QuizDetailResponse createQuiz(QuizCreateRequest request, UUID creatorId);

    // ==================== READ ====================
    /**
     * Get quiz by slug
     * @param slug Quiz slug (URL-friendly identifier)
     * @param userId User ID (nullable for public access)
     * @param password Password if quiz is password-protected
     * @return Quiz details with questions
     */
    QuizDetailResponse getQuizDetailBySlug(String slug, UUID userId, String password);

    /**
     * Get quiz by ID
     * @param quizId Quiz ID
     * @param userId User ID
     * @return Quiz details with questions
     */
    QuizDetailResponse getQuizDetailById(UUID quizId, UUID userId);

    /**
     * Get all published quizzes with optional keyword search
     * @param keyword Optional search keyword
     * @param pageable Pagination info
     * @return Page of quiz summaries
     */
    Page<QuizSummaryDto> getPublicQuizzes(String keyword, Pageable pageable);

    /**
     * Get all quizzes created by user
     * @param userId Creator ID
     * @param pageable Pagination info
     * @return Page of quiz summaries
     */
    Page<QuizSummaryDto> getMyQuizzes(UUID userId, Pageable pageable);

    /**
     * Get all draft quizzes (unpublished) for user
     * @param userId Creator ID
     * @param pageable Pagination info
     * @return Page of draft quiz summaries
     */
    Page<QuizSummaryDto> getMyDrafts(UUID userId, Pageable pageable);

    /**
     * Get trending quizzes (sorted by views/plays)
     * @param pageable Pagination info
     * @return Page of trending quiz summaries
     */
    Page<QuizSummaryDto> getTrendingQuizzes(Pageable pageable);

    /**
     * Get quizzes by difficulty level
     * @param difficulty EASY, MEDIUM, or HARD
     * @param pageable Pagination info
     * @return Page of quiz summaries
     */
    Page<QuizSummaryDto> getQuizzesByDifficulty(String difficulty, Pageable pageable);

    /**
     * Get quizzes by category
     * @param categoryId Category ID
     * @param pageable Pagination info
     * @return Page of quiz summaries
     */
    Page<QuizSummaryDto> getQuizzesByCategory(Integer categoryId, Pageable pageable);

    /**
     * Advanced search with multiple filters
     * @param keyword Search keyword
     * @param difficulty Filter by difficulty
     * @param categoryId Filter by category
     * @param pageable Pagination info
     * @return Page of matching quiz summaries
     */
    Page<QuizSummaryDto> searchQuizzes(String keyword, String difficulty, Integer categoryId, Pageable pageable);

    /**
     * Get popular quizzes filtered by category
     * Sorted by view count and play count
     * @param categoryId Category ID
     * @param pageable Pagination info
     * @return Page of popular quiz summaries
     */
    Page<QuizSummaryDto> getPopularByCategory(Integer categoryId, Pageable pageable);

    // ==================== UPDATE ====================
    /**
     * Update quiz details
     * @param quizId Quiz ID
     * @param request Update request
     * @param userId User ID (must be owner)
     * @return Updated quiz details
     */
    QuizDetailResponse updateQuiz(UUID quizId, QuizUpdateRequest request, UUID userId);

    // ==================== PUBLISH ====================
    /**
     * Publish a quiz (make it publicly available)
     * Quiz must have at least 3 questions to publish
     * @param quizId Quiz ID
     * @param userId User ID (must be owner)
     */
    void publishQuiz(UUID quizId, UUID userId);

    /**
     * Unpublish a quiz (make it private/draft)
     * @param quizId Quiz ID
     * @param userId User ID (must be owner)
     */
    void unpublishQuiz(UUID quizId, UUID userId);

    // ==================== DELETE ====================
    /**
     * Soft delete a quiz (mark as deleted but keep data)
     * @param quizId Quiz ID
     * @param userId User ID (must be owner)
     */
    void softDeleteQuiz(UUID quizId, UUID userId);

    /**
     * Hard delete a quiz (permanent removal)
     * All questions and options are also deleted
     * @param quizId Quiz ID
     * @param userId User ID (must be owner)
     */
    void hardDeleteQuiz(UUID quizId, UUID userId);

    /**
     * Restore a soft-deleted quiz
     * @param quizId Quiz ID
     * @param userId User ID (must be owner)
     */
    void restoreQuiz(UUID quizId, UUID userId);

    // ==================== DUPLICATE ====================
    /**
     * Duplicate a quiz with all its questions and options
     * New quiz is created as PRIVATE draft for the user
     * @param quizId Source quiz ID
     * @param userId User ID (owner of duplicate)
     * @return New quiz details
     */
    QuizDetailResponse duplicateQuiz(UUID quizId, UUID userId);

    // ==================== ANALYTICS & TRACKING ====================
    /**
     * Increment play count (when quiz is played/attempted)
     * @param quizId Quiz ID
     */
    void incrementPlayCount(UUID quizId);

    /**
     * Increment view count (when quiz is viewed)
     * @param quizId Quiz ID
     */
    void incrementViewCount(UUID quizId);

    /**
     * Increment start count (when user starts quiz)
     * @param quizId Quiz ID
     */
    void incrementStartCount(UUID quizId);

    /**
     * Increment completion count (when user completes quiz)
     * @param quizId Quiz ID
     */
    void incrementCompletionCount(UUID quizId);

    /**
     * Update average score
     * Called after each quiz completion to recalculate average
     * @param quizId Quiz ID
     * @param score New score to average in
     */
    void updateAverageScore(UUID quizId, double score);
}