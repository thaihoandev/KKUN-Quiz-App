package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkQuestionImportRequest {
    private UUID quizId;
    private MultipartFile file; // CSV or Excel
    private String fileType; // CSV, EXCEL
}
