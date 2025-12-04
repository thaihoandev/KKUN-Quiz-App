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
public class QuestionImportResult {
    private int rowNumber;
    private String status; // SUCCESS, FAILED
    private UUID questionId;
    private String errorMessage;
}
