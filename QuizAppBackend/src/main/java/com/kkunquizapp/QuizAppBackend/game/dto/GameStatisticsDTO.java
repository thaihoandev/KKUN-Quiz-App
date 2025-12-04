package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Thống kê tổng quan của game (dành cho host xem sau game)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStatisticsDTO {
    private UUID gameId;
    private int totalPlayers;
    private int completedPlayers;
    private int totalQuestions;
    private int totalAnswers;
    private int correctAnswers;
    private double averageScore;
    private double averageAccuracy;
}
