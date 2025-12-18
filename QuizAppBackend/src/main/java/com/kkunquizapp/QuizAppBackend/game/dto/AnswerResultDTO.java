package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Kết quả trả lời (gửi ngay sau khi submit)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResultDTO {
    private boolean correct;
    private int pointsEarned;
    private long responseTimeMs;
    private int currentScore;
    private String correctAnswer; // text hoặc list id
    private String explanation;
}
