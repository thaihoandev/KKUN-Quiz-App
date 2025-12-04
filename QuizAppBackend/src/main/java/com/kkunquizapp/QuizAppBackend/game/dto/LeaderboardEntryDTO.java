package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Entry trên bảng xếp hạng (real-time + final)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDTO {
    private int rank;
    private UUID participantId;
    private String nickname;
    private int score;
    private int correctCount;
    private int currentStreak;
    private Long averageTimeMs;
    private boolean isAnonymous;
}
