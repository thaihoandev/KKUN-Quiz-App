package com.kkunquizapp.QuizAppBackend.quiz.repository;

import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Quiz Repository
 * Data access for Quiz entity
 */
@Repository
public interface QuizRepo extends JpaRepository<Quiz, UUID> {

    // ==================== FIND BY SLUG ====================
    /**
     * Find quiz by slug and not deleted
     */
    Optional<Quiz> findBySlugAndDeletedFalse(String slug);

    /**
     * Find quiz by slug (including deleted)
     */
    Optional<Quiz> findBySlug(String slug);

    /**
     * Check if slug exists
     */
    boolean existsBySlugAndDeletedFalse(String slug);

    // ==================== FIND BY ID ====================
    /**
     * Find quiz by ID and not deleted
     */
    Optional<Quiz> findByQuizIdAndDeletedFalse(UUID quizId);

    /**
     * Find quiz by ID and creator (ownership check)
     */
    Optional<Quiz> findByQuizIdAndCreatorUserIdAndDeletedFalse(UUID quizId, UUID creatorId);

    /**
     * Find quiz by ID and creator (including deleted)
     */
    Optional<Quiz> findByQuizIdAndCreatorUserId(UUID quizId, UUID creatorId);

    // ==================== FIND BY CREATOR ====================
    /**
     * Find all quizzes by creator (not deleted)
     */
    Page<Quiz> findByCreatorUserIdAndDeletedFalseOrderByCreatedAtDesc(UUID creatorId, Pageable pageable);

    /**
     * Find all published quizzes by creator (not deleted)
     */
    Page<Quiz> findByCreatorUserIdAndPublishedTrueAndDeletedFalse(UUID creatorId, Pageable pageable);

    /**
     * Find all draft quizzes by creator (not deleted)
     */
    Page<Quiz> findByCreatorUserIdAndPublishedFalseAndDeletedFalseOrderByCreatedAtDesc(UUID creatorId, Pageable pageable);

    // ==================== FIND PUBLIC QUIZZES ====================
    /**
     * Find all published and not deleted quizzes
     */
    Page<Quiz> findByPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find public quizzes by difficulty
     */
    Page<Quiz> findByPublishedTrueAndDeletedFalseAndDifficulty(String difficulty, Pageable pageable);

    /**
     * Find public quizzes by category
     */
    Page<Quiz> findByPublishedTrueAndDeletedFalseAndCategoryId(Integer categoryId, Pageable pageable);

    /**
     * Find trending quizzes (sorted by views + plays)
     */
    @Query("SELECT q FROM Quiz q WHERE q.published = true AND q.deleted = false " +
            "ORDER BY (q.viewCount + q.totalLivePlays) DESC, q.createdAt DESC")
    Page<Quiz> findTrendingQuizzes(Pageable pageable);

    // ==================== SEARCH ====================
    /**
     * Search public quizzes by keyword
     * Searches in: title, description, tags
     */
    @Query("SELECT q FROM Quiz q WHERE q.published = true AND q.deleted = false AND " +
            "(LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(q.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Quiz> searchPublicQuizzes(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Advanced search with multiple filters
     */
    @Query("SELECT q FROM Quiz q WHERE q.published = true AND q.deleted = false AND " +
            "(:keyword IS NULL OR LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(q.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
            "(:categoryId IS NULL OR q.categoryId = :categoryId)")
    Page<Quiz> searchQuizzesAdvanced(@Param("keyword") String keyword,
                                     @Param("difficulty") String difficulty,
                                     @Param("categoryId") Integer categoryId,
                                     Pageable pageable);

    // ==================== FIND DELETED ====================
    /**
     * Find all deleted quizzes by creator
     */
    List<Quiz> findByCreatorUserIdAndDeletedTrueOrderByDeletedAtDesc(UUID creatorId);

    /**
     * Find all deleted quizzes (for admin)
     */
    List<Quiz> findByDeletedTrueOrderByDeletedAtDesc();

    // ==================== CHECK EXISTS ====================
    /**
     * Check if quiz exists and not deleted
     */
    boolean existsByQuizIdAndDeletedFalse(UUID quizId);

    /**
     * Check if quiz is published
     */
    @Query("SELECT CASE WHEN q.published = true THEN true ELSE false END FROM Quiz q WHERE q.quizId = :quizId")
    boolean isPublished(@Param("quizId") UUID quizId);

    // ==================== COUNT ====================
    /**
     * Count published quizzes by creator
     */
    long countByCreatorUserIdAndPublishedTrueAndDeletedFalse(UUID creatorId);

    /**
     * Count draft quizzes by creator
     */
    long countByCreatorUserIdAndPublishedFalseAndDeletedFalse(UUID creatorId);

    /**
     * Count total published quizzes
     */
    long countByPublishedTrueAndDeletedFalse();

    // ==================== UPDATE OPERATIONS ====================
    /**
     * Increment play count
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.totalLivePlays = q.totalLivePlays + 1 WHERE q.quizId = :quizId")
    void incrementPlayCount(@Param("quizId") UUID quizId);

    /**
     * Increment view count
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.viewCount = q.viewCount + 1 WHERE q.quizId = :quizId")
    void incrementViewCount(@Param("quizId") UUID quizId);

    /**
     * Increment start count
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.startCount = q.startCount + 1 WHERE q.quizId = :quizId")
    void incrementStartCount(@Param("quizId") UUID quizId);

    /**
     * Increment completion count
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.completionCount = q.completionCount + 1 WHERE q.quizId = :quizId")
    void incrementCompletionCount(@Param("quizId") UUID quizId);

    /**
     * Update average score
     * Recalculates average: (currentAvg * (totalSessions - 1) + newScore) / totalSessions
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.averageScore = :score WHERE q.quizId = :quizId")
    void updateAverageScore(@Param("quizId") UUID quizId, @Param("score") double score);

    /**
     * Publish quiz
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.published = true, q.updatedAt = CURRENT_TIMESTAMP WHERE q.quizId = :quizId")
    void publishQuiz(@Param("quizId") UUID quizId);

    /**
     * Unpublish quiz
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.published = false, q.updatedAt = CURRENT_TIMESTAMP WHERE q.quizId = :quizId")
    void unpublishQuiz(@Param("quizId") UUID quizId);

    /**
     * Soft delete quiz
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.deleted = true, q.deletedAt = CURRENT_TIMESTAMP WHERE q.quizId = :quizId")
    void softDeleteById(@Param("quizId") UUID quizId);

    /**
     * Soft delete all quizzes by creator
     */
    @Modifying
    @Query("UPDATE Quiz q SET q.deleted = true, q.deletedAt = CURRENT_TIMESTAMP WHERE q.creator.userId = :creatorId AND q.deleted = false")
    void softDeleteByCreatorId(@Param("creatorId") UUID creatorId);

    // ==================== ANALYTICS QUERIES ====================
    /**
     * Get average score across all attempts of a quiz
     */
    @Query("SELECT AVG(s.score) FROM Quiz q JOIN QuizSession s ON s.quiz.quizId = q.quizId " +
            "WHERE q.quizId = :quizId AND s.isSubmitted = true")
    Double getAverageScoreFromSessions(@Param("quizId") UUID quizId);

    /**
     * Get total attempts for a quiz
     */
    @Query("SELECT COUNT(s) FROM Quiz q JOIN QuizSession s ON s.quiz.quizId = q.quizId " +
            "WHERE q.quizId = :quizId")
    long getTotalAttempts(@Param("quizId") UUID quizId);

    /**
     * Get completion rate
     */
    @Query("SELECT (COUNT(CASE WHEN s.isSubmitted = true THEN 1 END) * 100.0 / COUNT(s)) " +
            "FROM Quiz q JOIN QuizSession s ON s.quiz.quizId = q.quizId " +
            "WHERE q.quizId = :quizId")
    Double getCompletionRate(@Param("quizId") UUID quizId);

    /**
     * Get most popular quizzes by category
     */
    @Query("SELECT q FROM Quiz q WHERE q.categoryId = :categoryId AND q.published = true AND q.deleted = false " +
            "ORDER BY q.viewCount DESC")
    Page<Quiz> getPopularQuizzesByCategory(@Param("categoryId") Integer categoryId, Pageable pageable);

    /**
     * Get top creators by quiz count
     */
    @Query("SELECT q.creator.userId, COUNT(q) as quiz_count FROM Quiz q " +
            "WHERE q.published = true AND q.deleted = false " +
            "GROUP BY q.creator.userId ORDER BY quiz_count DESC")
    Page<Object[]> getTopCreators(Pageable pageable);
}