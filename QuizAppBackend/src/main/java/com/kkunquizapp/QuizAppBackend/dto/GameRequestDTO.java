package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class GameRequestDTO {
    private UUID quizId;
    private String pinCode;
    private String status; // "waiting", "in_progress", "completed"
}

