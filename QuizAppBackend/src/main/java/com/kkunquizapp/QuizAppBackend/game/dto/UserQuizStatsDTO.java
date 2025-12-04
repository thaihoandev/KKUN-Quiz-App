package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Thống kê của người dùng với một quiz cụ thể
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserQuizStatsDTO {
    private UUID quizId;
    private String quizTitle;
    private int totalGamesPlayed;
    private int totalGamesCompleted;
    private int highestScore;
    private double averageScore;
    private double accuracy;
    private int totalCorrectAnswers;
    private int totalQuestionsAnswered;
    private long totalTimeSpentMs;
    private Integer bestRank;
    private int longestStreak;
    private LocalDateTime lastPlayedAt;
}
