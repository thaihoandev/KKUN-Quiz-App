package com.kkunquizapp.QuizAppBackend.quiz.dto;

import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Difficulty;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Visibility;
import com.kkunquizapp.QuizAppBackend.user.dto.UserSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDetailResponse {

    private UUID quizId;
    private String title;
    private String description;
    private String slug;
    private String coverImageUrl;
    private UserSummaryDto creator;
    private Difficulty difficulty;
    private Integer estimatedMinutes;
    private Visibility visibility;
    private boolean published;
    private boolean deleted;
    private String accessPassword;
    // Statistics
    private int totalQuestions;
    private int totalSessions;
    private int totalLivePlays;
    private double averageScore;
    private int averageTimeSpent;
    private int viewCount;
    private int startCount;
    private int completionCount;

    // Tags
    private List<String> tags;

    // Questions
    private List<QuestionResponseDTO> questions;

    // Access control
    private boolean isOwner;
    private boolean canPlay;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
