package com.kkunquizapp.QuizAppBackend.game.repository;

import com.kkunquizapp.QuizAppBackend.game.model.UserQuizStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserQuizStatisticsRepo extends JpaRepository<UserQuizStatistics, UUID> {

    Optional<UserQuizStatistics> findByUserUserIdAndQuizQuizId(UUID userId, UUID quizId);

    // Global stats (khi quizId = null)
    Optional<UserQuizStatistics> findByUserUserIdAndQuizIsNull(UUID userId);

    // Top players theo quiz
    List<UserQuizStatistics> findTop10ByQuizQuizIdOrderByHighestScoreDesc(UUID quizId);
}