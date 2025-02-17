package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class PlayerResponseDTO {
    private UUID playerId;
    private UUID gameId;
    private UUID userId; // Null nếu người chơi là ẩn danh
    private String nickname;
    private int score;
    private boolean isAnonymous;
    private boolean isInGame;

}
