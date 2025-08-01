package com.kkunquizapp.QuizAppBackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiResponseDTO {
    private boolean success;
    private String message;
}
