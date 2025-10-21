package com.kkunquizapp.QuizAppBackend.game.dto;


import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class GameResponseDTO {
    private UUID gameId;
    private UUID quizId;
    private UUID hostId;
    private String pinCode;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
