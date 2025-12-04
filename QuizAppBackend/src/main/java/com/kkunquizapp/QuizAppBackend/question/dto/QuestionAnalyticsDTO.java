package com.kkunquizapp.QuizAppBackend.question.dto;

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
public class QuestionAnalyticsDTO {
    private UUID questionId;
    private String questionText;
    private String questionType;
    private int totalAttempts;
    private int correctAttempts;
    private double passRate;
    private int averageTimeSeconds;
    private double difficultyIndex;
    private double discriminationIndex;
    private List<OptionAnalyticsDTO> optionAnalytics;
}
