package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class LeaderboardResponseDTO {
    private UUID leaderboardId;
    private UUID gameId;
    private UUID playerId;
    private int rank;
    private int totalScore;
}
