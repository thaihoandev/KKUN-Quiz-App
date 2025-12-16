package com.kkunquizapp.QuizAppBackend.game.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kkunquizapp.QuizAppBackend.game.model.enums.ParticipantStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// DTO trả về khi join thành công
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameParticipantDTO {
    private UUID participantId;
    private UUID gameId;
    private String nickname;
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;
    private String guestToken; // chỉ có nếu anonymous
    private LocalDateTime guestExpiresAt;
    private int score;
    private ParticipantStatus status;
    private LocalDateTime joinedAt;
}
