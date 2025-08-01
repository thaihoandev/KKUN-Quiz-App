package com.kkunquizapp.QuizAppBackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerScoreResponseDTO {
    private UUID playerId;
    private int score;
}