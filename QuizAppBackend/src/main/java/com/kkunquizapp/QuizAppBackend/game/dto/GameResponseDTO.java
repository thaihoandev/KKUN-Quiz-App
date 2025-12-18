package com.kkunquizapp.QuizAppBackend.game.dto;


import com.kkunquizapp.QuizAppBackend.game.model.enums.GameStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

// Thông tin game cơ bản (dùng cho lobby, tìm game bằng PIN)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameResponseDTO {
    private UUID gameId;
    private String pinCode;
    private GameStatus status;
    private String quizTitle;
    private String quizThumbnail;
    private String hostParticipantId;
    private String hostNickname;
    private int playerCount;
    private int maxPlayers;
    private boolean allowAnonymous;
    private boolean showLeaderboard;
    private int totalQuestions;
    private LocalDateTime createdAt;
}

// ==================== ENUMS dùng chung trong DTO ====================

