package com.kkunquizapp.QuizAppBackend.question.repository;

import com.kkunquizapp.QuizAppBackend.question.model.Question;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepo extends JpaRepository<Question, UUID> {

    // Find questions by quiz
    List<Question> findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(UUID quizId);
    Page<Question> findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(UUID quizId, Pageable pageable);

    // Find by quiz without pagination
    List<Question> findByQuizQuizIdAndDeletedFalse(UUID quizId);

    // Count questions
    int countByQuizQuizIdAndDeletedFalse(UUID quizId);

    // Search questions
    @Query("SELECT q FROM Question q WHERE " +
            "q.deleted = false AND (" +
            "LOWER(q.questionText) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(q.tagsJson) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
            ") " +
            "AND (:questionType IS NULL OR q.type = :questionType) " +
            "AND (:difficulty IS NULL OR q.difficulty = :difficulty)")
    Page<Question> searchQuestions(@Param("keyword") String keyword,
                                   @Param("questionType") String questionType,
                                   @Param("difficulty") String difficulty,
                                   Pageable pageable);

    // Find by tags
    List<Question> findByTagsJsonContainsAndDeletedFalse(String tag);

    // Find favorite questions
    @Query("SELECT q FROM Question q WHERE q.isFavorite = true AND q.deleted = false ORDER BY q.updatedAt DESC")
    List<Question> findFavoritesByUserId(@Param("userId") UUID userId);

    // Find deleted questions
    List<Question> findByDeletedTrueOrderByDeletedAtDesc();

    // Find by difficulty
    List<Question> findByDifficultyAndDeletedFalse(String difficulty);

    // Find by question type
    List<Question> findByTypeAndDeletedFalse(String type);

    // Delete by quiz (hard delete)
    void deleteByQuizQuizId(UUID quizId);

    // Soft delete all questions in quiz
    @Query("UPDATE Question q SET q.deleted = true WHERE q.quiz.quizId = :quizId AND q.deleted = false")
    void softDeleteByQuizId(@Param("quizId") UUID quizId);

    // Find questions created by user
    List<Question> findByCreatedByAndDeletedFalse(UUID createdBy);

    // Check if question exists
    boolean existsByQuestionIdAndDeletedFalse(UUID questionId);

    List<Question> findByQuizAndDeletedFalse(Quiz quiz);
}