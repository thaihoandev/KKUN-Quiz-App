package com.kkunquizapp.QuizAppBackend.question.repository;

import com.kkunquizapp.QuizAppBackend.question.model.Question;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionRepo extends JpaRepository<Question, UUID> {

    // ==================== FIND BY QUIZ ====================

    /**
     * Find all questions by quiz with ordering
     */
    List<Question> findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(UUID quizId);

    /**
     * Find paginated questions by quiz
     */
    Page<Question> findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(UUID quizId, Pageable pageable);

    /**
     * Find all questions by quiz without pagination
     */
    List<Question> findByQuizQuizIdAndDeletedFalse(UUID quizId);

    /**
     * Find questions by quiz object
     */
    List<Question> findByQuizAndDeletedFalse(Quiz quiz);

    /**
     * Count total questions in quiz (excluding deleted)
     */
    int countByQuizQuizIdAndDeletedFalse(UUID quizId);

    /**
     * Count total questions in quiz (including deleted)
     */
    int countByQuizQuizId(UUID quizId);

    // ==================== SEARCH & FILTER ====================

    /**
     * Search questions by keyword, type, and difficulty
     * Supports full-text search on question text and tags
     */
    @Query("SELECT q FROM Question q WHERE " +
            "q.deleted = false AND (" +
            "LOWER(q.questionText) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "CAST(q.tagsJson AS String) LIKE CONCAT('%', :keyword, '%')" +
            ") " +
            "AND (:questionType IS NULL OR q.type = CAST(:questionType AS com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType)) " +
            "AND (:difficulty IS NULL OR q.difficulty = :difficulty) " +
            "ORDER BY q.createdAt DESC")
    Page<Question> searchQuestions(
            @Param("keyword") String keyword,
            @Param("questionType") String questionType,
            @Param("difficulty") String difficulty,
            Pageable pageable
    );

    /**
     * Find questions by tag (using JSONB contains)
     */
    @Query(value = "SELECT q FROM Question q WHERE " +
            "q.deleted = false AND " +
            "CAST(q.tagsJson AS String) LIKE CONCAT('%', :tag, '%') " +
            "ORDER BY q.createdAt DESC")
    List<Question> findByTagsJsonContainsAndDeletedFalse(@Param("tag") String tag);

    /**
     * Find questions by difficulty
     */
    List<Question> findByDifficultyAndDeletedFalse(String difficulty);

    /**
     * Find questions by type
     */
    List<Question> findByTypeAndDeletedFalse(QuestionType type);

    /**
     * Find questions by multiple types
     */
    @Query("SELECT q FROM Question q WHERE q.type IN :types AND q.deleted = false ORDER BY q.createdAt DESC")
    List<Question> findByTypesAndDeletedFalse(@Param("types") List<QuestionType> types);

    // ==================== FAVORITES ====================

    /**
     * Find all favorite questions for user
     */
    @Query("SELECT q FROM Question q WHERE q.isFavorite = true AND q.deleted = false ORDER BY q.updatedAt DESC")
    List<Question> findFavoritesByUserId(@Param("userId") UUID userId);

    /**
     * Check if question is marked as favorite
     */
    @Query("SELECT q.isFavorite FROM Question q WHERE q.questionId = :questionId")
    boolean isFavorite(@Param("questionId") UUID questionId);

    /**
     * Count favorite questions
     */
    @Query("SELECT COUNT(q) FROM Question q WHERE q.isFavorite = true AND q.deleted = false")
    long countFavorites();

    // ==================== AUDIT & TRACKING ====================

    /**
     * Find questions created by specific user
     */
    List<Question> findByCreatedByAndDeletedFalse(UUID createdBy);

    /**
     * Find questions created by user (paginated)
     */
    @Query("SELECT q FROM Question q WHERE q.createdBy = :createdBy AND q.deleted = false ORDER BY q.createdAt DESC")
    Page<Question> findByCreatedByAndDeletedFalse(@Param("createdBy") UUID createdBy, Pageable pageable);

    /**
     * Find recently updated questions
     */
    @Query("SELECT q FROM Question q WHERE q.deleted = false ORDER BY q.updatedAt DESC")
    Page<Question> findRecentlyUpdated(Pageable pageable);

    // ==================== SOFT DELETE ====================

    /**
     * Find all deleted questions
     */
    List<Question> findByDeletedTrueOrderByDeletedAtDesc();

    /**
     * Find deleted questions by quiz
     */
    @Query("SELECT q FROM Question q WHERE q.quiz.quizId = :quizId AND q.deleted = true ORDER BY q.deletedAt DESC")
    List<Question> findDeletedByQuizId(@Param("quizId") UUID quizId);

    /**
     * Soft delete all questions in quiz
     */
    @Modifying
    @Transactional
    @Query("UPDATE Question q SET q.deleted = true, q.deletedAt = CURRENT_TIMESTAMP WHERE q.quiz.quizId = :quizId AND q.deleted = false")
    void softDeleteByQuizId(@Param("quizId") UUID quizId);

    /**
     * Soft delete by question ID
     */
    @Modifying
    @Transactional
    @Query("UPDATE Question q SET q.deleted = true, q.deletedAt = CURRENT_TIMESTAMP WHERE q.questionId = :questionId")
    void softDeleteById(@Param("questionId") UUID questionId);

    /**
     * Restore deleted question
     */
    @Modifying
    @Transactional
    @Query("UPDATE Question q SET q.deleted = false, q.deletedAt = null WHERE q.questionId = :questionId AND q.deleted = true")
    void restoreById(@Param("questionId") UUID questionId);

    // ==================== EXISTENCE CHECKS ====================

    /**
     * Check if question exists and not deleted
     */
    boolean existsByQuestionIdAndDeletedFalse(UUID questionId);

    /**
     * Check if question exists in quiz
     */
    boolean existsByQuestionIdAndQuizQuizIdAndDeletedFalse(UUID questionId, UUID quizId);

    /**
     * Check if quiz has any active questions
     */
    boolean existsByQuizQuizIdAndDeletedFalse(UUID quizId);

    /**
     * Find question by ID (optional)
     */
    @Query("SELECT q FROM Question q WHERE q.questionId = :questionId AND q.deleted = false")
    Optional<Question> findByIdAndNotDeleted(@Param("questionId") UUID questionId);

    // ==================== HARD DELETE ====================

    /**
     * Hard delete all questions in quiz (cascade delete)
     */
    @Modifying
    @Transactional
    void deleteByQuizQuizId(UUID quizId);

    /**
     * Hard delete question by ID
     */
    @Modifying
    @Transactional
    void deleteByQuestionId(UUID questionId);

    // ==================== ANALYTICS & STATISTICS ====================

    /**
     * Find questions with high difficulty index
     */
    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.difficultyIndex >= :threshold ORDER BY q.difficultyIndex DESC")
    List<Question> findDifficultQuestions(@Param("threshold") double threshold);

    /**
     * Find questions that need attention (low pass rate)
     */
    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.passRate < :threshold ORDER BY q.passRate ASC")
    List<Question> findProblematicQuestions(@Param("threshold") double threshold);

    /**
     * Count questions by difficulty level
     */
    @Query("SELECT COUNT(q) FROM Question q WHERE q.deleted = false AND q.difficulty = :difficulty")
    long countByDifficulty(@Param("difficulty") String difficulty);

    /**
     * Count questions by type
     */
    @Query("SELECT COUNT(q) FROM Question q WHERE q.deleted = false AND q.type = :type")
    long countByType(@Param("type") QuestionType type);

    /**
     * Get average pass rate for quiz
     */
    @Query("SELECT AVG(q.passRate) FROM Question q WHERE q.quiz.quizId = :quizId AND q.deleted = false")
    Double getAveragePassRate(@Param("quizId") UUID quizId);

    /**
     * Get total attempts across quiz
     */
    @Query("SELECT SUM(q.totalAttempts) FROM Question q WHERE q.quiz.quizId = :quizId AND q.deleted = false")
    Long getTotalAttempts(@Param("quizId") UUID quizId);

    // ==================== BULK OPERATIONS ====================

    /**
     * Find all questions by quiz IDs
     */
    @Query("SELECT q FROM Question q WHERE q.quiz.quizId IN :quizIds AND q.deleted = false ORDER BY q.quiz.quizId, q.orderIndex")
    List<Question> findByQuizIds(@Param("quizIds") List<UUID> quizIds);

    /**
     * Find questions with specific tags
     */
    @Query("SELECT q FROM Question q WHERE q.deleted = false AND (" +
            "CAST(q.tagsJson AS String) LIKE CONCAT('%', :tag1, '%') OR " +
            "CAST(q.tagsJson AS String) LIKE CONCAT('%', :tag2, '%')" +
            ") ORDER BY q.createdAt DESC")
    List<Question> findByMultipleTags(@Param("tag1") String tag1, @Param("tag2") String tag2);

    /**
     * Bulk update difficulty
     */
    @Modifying
    @Transactional
    @Query("UPDATE Question q SET q.difficulty = :difficulty WHERE q.questionId IN :questionIds")
    void updateDifficultyForQuestions(@Param("questionIds") List<UUID> questionIds, @Param("difficulty") String difficulty);

    /**
     * Bulk update tags
     */
    @Modifying
    @Transactional
    @Query("UPDATE Question q SET q.tagsJson = :tagsJson WHERE q.questionId IN :questionIds")
    void updateTagsForQuestions(@Param("questionIds") List<UUID> questionIds, @Param("tagsJson") String tagsJson);

    // ==================== ORDERING ====================

    /**
     * Update question order in quiz
     */
    @Modifying
    @Transactional
    @Query("UPDATE Question q SET q.orderIndex = :orderIndex WHERE q.questionId = :questionId")
    void updateOrderIndex(@Param("questionId") UUID questionId, @Param("orderIndex") int orderIndex);

    /**
     * Get max order index in quiz
     */
    @Query("SELECT COALESCE(MAX(q.orderIndex), 0) FROM Question q WHERE q.quiz.quizId = :quizId AND q.deleted = false")
    int getMaxOrderIndex(@Param("quizId") UUID quizId);
}