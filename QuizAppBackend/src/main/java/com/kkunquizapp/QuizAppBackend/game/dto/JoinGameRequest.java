package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Request khi tham gia game (có đăng nhập hoặc anonymous)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinGameRequest {
    private String nickname;
}
