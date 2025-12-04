package com.kkunquizapp.QuizAppBackend.game.dto;
import com.kkunquizapp.QuizAppBackend.game.model.enums.GameStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
// Chi tiết game (dành cho host hoặc người chơi đang trong game)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameDetailDTO {
    private UUID gameId;
    private String pinCode;
    private GameStatus gameStatus;
    private QuizInfoDTO quiz;
    private HostInfoDTO host;
    private int playerCount;
    private int activePlayerCount;
    private int maxPlayers;
    private boolean allowAnonymous;
    private boolean showLeaderboard;
    private boolean randomizeQuestions;
    private boolean randomizeOptions;
    private int totalQuestions;
    private int currentQuestionIndex;
    private Integer timeLimitSeconds; // nếu đang có câu hỏi hiện tại
    private boolean isHost;
    private ParticipantInfoDTO currentParticipant; // null nếu là host
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
