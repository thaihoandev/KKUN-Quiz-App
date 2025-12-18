package com.kkunquizapp.QuizAppBackend.game.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CurrentQuestionResponseDTO {
    private QuestionResponseDTO question;
    private int questionNumber;        // ví dụ: 1
    private int totalQuestions;
    private int timeLimitSeconds;
    private long remainingTimeSeconds; // tính từ server time - questionStartTime
    private boolean hasCurrentQuestion; // true nếu đang có câu hỏi, false nếu chưa bắt đầu hoặc đã hết
}