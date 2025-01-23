package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class QuizResponseDTO {
    private UUID quizId;
    private String title;
    private String description;
    private String status;
    private UUID hostId; // ID của người tạo bài kiểm tra
}
