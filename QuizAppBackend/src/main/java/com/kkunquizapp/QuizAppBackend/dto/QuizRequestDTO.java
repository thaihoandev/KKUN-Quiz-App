package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class QuizRequestDTO {
    private String title;
    private String description;
    private String status; // "draft", "live", "completed", "closed"
}
