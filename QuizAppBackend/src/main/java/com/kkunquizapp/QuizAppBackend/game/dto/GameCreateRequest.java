package com.kkunquizapp.QuizAppBackend.game.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
// Request khi tạo game
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameCreateRequest {
    private UUID quizId;
    private Integer maxPlayers;
    private boolean allowAnonymous = true;
    private boolean showLeaderboard = true;
    private boolean randomizeQuestions = false;
    private boolean randomizeOptions = false;
    private Map<String, Object> settings; // JSON settings tùy chỉnh
}
