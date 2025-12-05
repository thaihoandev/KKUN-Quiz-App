package com.kkunquizapp.QuizAppBackend.quiz.dto;

import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Difficulty;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizCreateRequest {

    @NotBlank(message = "Quiz title is required")
    @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private String coverImageUrl;

    private Difficulty difficulty;

    private Integer estimatedMinutes;

    private Visibility visibility;

    private String accessPassword;

    private List<String> tags;

    private List<UUID> allowedUserIds;

}

