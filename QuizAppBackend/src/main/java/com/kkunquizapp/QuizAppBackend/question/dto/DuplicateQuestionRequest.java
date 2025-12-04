package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DuplicateQuestionRequest {
    private UUID sourceQuestionId;
    private UUID targetQuizId;
    private boolean copyAnalytics;
}
