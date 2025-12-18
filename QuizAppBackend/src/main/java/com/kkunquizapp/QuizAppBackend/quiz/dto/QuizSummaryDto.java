package com.kkunquizapp.QuizAppBackend.quiz.dto;

import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Difficulty;
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
public class QuizSummaryDto {

    private UUID quizId;
    private String title;
    private String slug;
    private String coverImageUrl;
    private UserSummaryDto creator;
    private Difficulty difficulty;
    private Integer estimatedMinutes;
    private boolean published;

    // Statistics
    private int totalQuestions;
    private int totalSessions;
    private double averageScore;
    private int viewCount;
    private int startCount;

    // Tags
    private List<String> tags;

    private LocalDateTime createdAt;
}
