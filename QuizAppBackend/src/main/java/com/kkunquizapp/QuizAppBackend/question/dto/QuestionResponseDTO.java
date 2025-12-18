package com.kkunquizapp.QuizAppBackend.question.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuestionResponseDTO {
    private UUID questionId;
    private UUID quizId;
    private String questionText;
    private String questionType;
    private String imageUrl;
    private int timeLimitSeconds;
    private int points;
    private int orderIndex;
    private String explanation;
    private String hint;
    private String difficulty;
    private List<String> tags;
    private boolean shuffleOptions;
    private boolean caseInsensitive;
    private boolean partialCredit;
    private boolean allowMultipleCorrect;
    private List<String> answerVariations;

    // Soft delete info
    private boolean deleted;
    private LocalDateTime deletedAt;
    private UUID deletedBy;

    // Audit info
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int version;

    // Analytics
    private int totalAttempts;
    private int correctAttempts;
    private double passRate;
    private int averageTimeSeconds;
    private double difficultyIndex;
    private double discriminationIndex;

    // Rich content flags
    private boolean hasLatex;
    private boolean hasCode;
    private boolean hasTable;
    private boolean hasVideo;
    private boolean hasAudio;

    // Options
    private List<OptionResponseDTO> options;
}
