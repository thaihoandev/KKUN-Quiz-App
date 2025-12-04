package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Thông tin host
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostInfoDTO {
    private UUID userId;
    private String username;
    private String nickname;
    private String avatarUrl;
}
