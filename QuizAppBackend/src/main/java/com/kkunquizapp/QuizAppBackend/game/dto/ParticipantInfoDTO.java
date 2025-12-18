package com.kkunquizapp.QuizAppBackend.game.dto;
import com.kkunquizapp.QuizAppBackend.game.model.enums.ParticipantStatus;
import lombok.*;

import java.util.UUID;
// Thông tin người chơi hiện tại (nếu đã join)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantInfoDTO {
    private UUID participantId;
    private String nickname;
    private boolean isAnonymous;
    private int score;
    private int correctCount;
    private ParticipantStatus status;
}
