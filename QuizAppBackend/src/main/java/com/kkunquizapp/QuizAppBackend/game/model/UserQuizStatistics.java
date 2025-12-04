package com.kkunquizapp.QuizAppBackend.game.model;

import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_quiz_statistics", indexes = {
        @Index(name = "idx_stats_user", columnList = "user_id"),
        @Index(name = "idx_stats_quiz", columnList = "quiz_id"),
        @Index(name = "idx_stats_user_quiz", columnList = "user_id, quiz_id", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserQuizStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID statisticsId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz; // null = global statistics

    // === Session counts ===
    @Column(nullable = false)
    @Builder.Default
    private int totalGamesPlayed = 0;

    @Column(nullable = false)
    @Builder.Default
    private int totalGamesCompleted = 0;

    @Column(nullable = false)
    @Builder.Default
    private int totalGamesAbandoned = 0;

    // === Answer statistics ===
    @Column(nullable = false)
    @Builder.Default
    private int totalQuestionsAnswered = 0;

    @Column(nullable = false)
    @Builder.Default
    private int totalCorrectAnswers = 0;

    @Column(nullable = false)
    @Builder.Default
    private int totalIncorrectAnswers = 0;

    @Column(nullable = false)
    @Builder.Default
    private int totalSkippedQuestions = 0;

    // === Score tracking ===
    @Column(nullable = false)
    @Builder.Default
    private int totalPoints = 0;

    @Column(nullable = false)
    @Builder.Default
    private int highestScore = 0;

    @Column(nullable = false)
    @Builder.Default
    private double averageScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double accuracy = 0.0; // % correct

    // === Time tracking ===
    @Column(nullable = false)
    @Builder.Default
    private long totalTimeSpentMs = 0L;

    @Column(nullable = false)
    @Builder.Default
    private long averageTimePerQuestionMs = 0L;

    @Column(nullable = false)
    @Builder.Default
    private long fastestAnswerTimeMs = 0L;

    // === Streak tracking ===
    @Column(nullable = false)
    @Builder.Default
    private int currentStreak = 0;

    @Column(nullable = false)
    @Builder.Default
    private int longestStreak = 0;

    @Column(nullable = false)
    @Builder.Default
    private int dailyStreak = 0;

    // === Ranking ===
    @Column
    private Integer bestRank; // có thể null

    @Column(nullable = false)
    @Builder.Default
    private double averageRank = 0.0;

    // === Timestamps ===
    private LocalDateTime firstPlayedAt;
    private LocalDateTime lastPlayedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ===================== Helper methods =====================
    public void recordGamePlayed() {
        this.totalGamesPlayed++;
        this.lastPlayedAt = LocalDateTime.now();
        if (this.firstPlayedAt == null) {
            this.firstPlayedAt = LocalDateTime.now();
        }
    }

    public void recordGameCompleted() {
        this.totalGamesCompleted++;
    }

    public void recordGameAbandoned() {
        this.totalGamesAbandoned++;
    }

    public void updateAccuracy() {
        if (this.totalQuestionsAnswered > 0) {
            this.accuracy = (this.totalCorrectAnswers * 100.0) / this.totalQuestionsAnswered;
        } else {
            this.accuracy = 0.0;
        }
    }

    public void updateAverageScore() {
        if (this.totalGamesCompleted > 0) {
            this.averageScore = this.totalPoints * 1.0 / this.totalGamesCompleted;
        } else {
            this.averageScore = 0.0;
        }
    }

    public void updateStreak(boolean isCorrect) {
        if (isCorrect) {
            this.currentStreak++;
            if (this.currentStreak > this.longestStreak) {
                this.longestStreak = this.currentStreak;
            }
        } else {
            this.currentStreak = 0;
        }
    }
}