package com.kkunquizapp.QuizAppBackend.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Chuẩn API Response toàn hệ thống
 * Dùng cho mọi controller trả về thông báo thành công/thất bại
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Không trả về field null
public class ApiResponseDTO {

    private boolean success;
    private String message;
    private Object data;                    // Dùng khi cần trả thêm data (ví dụ: gameId, participantId, v.v.)
    private LocalDateTime timestamp;

    // ==================== STATIC FACTORIES (SIÊU TIỆN!) ====================

    public static ApiResponseDTO success(String message) {
        return ApiResponseDTO.builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponseDTO success(String message, Object data) {
        return ApiResponseDTO.builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponseDTO success(Object data) {
        return ApiResponseDTO.builder()
                .success(true)
                .message("Success")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponseDTO error(String message) {
        return ApiResponseDTO.builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponseDTO error(String message, Object data) {
        return ApiResponseDTO.builder()
                .success(false)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}