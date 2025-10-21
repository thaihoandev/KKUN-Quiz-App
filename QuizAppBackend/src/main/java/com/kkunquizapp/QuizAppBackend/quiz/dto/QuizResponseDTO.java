package com.kkunquizapp.QuizAppBackend.quiz.dto;

import com.kkunquizapp.QuizAppBackend.quiz.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class QuizResponseDTO {
    private UUID quizId;
    private String title;
    private String description;
    private UserDto host;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private QuizStatus status;
    private List<UserDto> viewers;
    private List<UserDto> editors;
    private List<QuestionResponseDTO> questions;
    // Nested DTO for user data (to avoid exposing full User entity)
    private double recommendationScore; // New field for recommendation score
    @Data
    public static class UserDto {
        private UUID userId;
        private String name;
        private String avatar; // Assuming User entity has an avatar field
    }
}
