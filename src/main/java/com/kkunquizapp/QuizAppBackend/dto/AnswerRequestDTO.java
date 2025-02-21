package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class AnswerRequestDTO {
    private UUID playerId;
    private UUID questionId;
    private String selectedAnswer; // Đáp án mà người chơi chọn (chuỗi)
}