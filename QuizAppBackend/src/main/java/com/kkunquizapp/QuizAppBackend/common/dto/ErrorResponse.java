package com.kkunquizapp.QuizAppBackend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private String message;
    private String path;
    private Map<String, String> details;

    // Thêm 2 constructor tiện lợi này để dùng khi không có details
    public ErrorResponse(LocalDateTime timestamp, String message, String path) {
        this.timestamp = timestamp;
        this.message = message;
        this.path = path;
        this.details = null;
    }

}