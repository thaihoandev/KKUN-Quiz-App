package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Request khi trả lời câu hỏi
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitAnswerRequest {
    private Object submittedAnswer; // UUID (single), List<UUID> (multi), Boolean, String...
    private LocalDateTime submittedAt;
}
