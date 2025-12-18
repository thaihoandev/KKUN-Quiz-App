package com.kkunquizapp.QuizAppBackend.quiz.dto;

import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Difficulty;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Visibility;
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
public class QuizUpdateRequest {

    private String title;
    private String description;
    private String coverImageUrl;
    private Difficulty difficulty;
    private Integer estimatedMinutes;
    private Visibility visibility;
    private String accessPassword;
    private List<String> tags;
    private List<UUID> allowedUserIds;
}
