package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkQuestionImportResponse {
    private int totalQuestions;
    private int successCount;
    private int failedCount;
    private List<QuestionImportResult> results;
    private List<String> errors;
}
