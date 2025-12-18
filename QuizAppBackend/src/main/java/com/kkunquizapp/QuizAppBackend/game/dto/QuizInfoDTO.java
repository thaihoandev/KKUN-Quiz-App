package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Thông tin quiz trong GameDetailDTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizInfoDTO {
    private UUID quizId;
    private String title;
    private String description;
    private String thumbnailUrl;
    private int questionCount;
}
