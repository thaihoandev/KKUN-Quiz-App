package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionVersionDTO {
    private Long versionId;
    private UUID questionId;
    private int versionNumber;
    private String questionText;
    private String questionType;
    private String changesDescription;
    private UUID changedBy;
    private LocalDateTime changedAt;
}
