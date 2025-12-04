package com.kkunquizapp.QuizAppBackend.game.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // không gửi field null ra client/kafka
public class GameEvent {

    private UUID gameId;

    // Dùng String như bạn đang làm (phù hợp Kafka + frontend dễ parse)
    private String eventType;

    // ID người gây ra event (có thể là participantId)
    private UUID userId;

    // Nickname của người chơi (tùy chọn hiển thị)
    private String nickname;

    // Payload linh hoạt - dùng Map cho dễ serialize Kafka + frontend
    private Map<String, Object> data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // === Các event type phổ biến (dùng hằng số để tránh typo) ===
    public static final String GAME_CREATED = "GAME_CREATED";
    public static final String GAME_STARTED = "GAME_STARTED";
    public static final String QUESTION_STARTED = "QUESTION_STARTED";
    public static final String QUESTION_ENDED = "QUESTION_ENDED";
    public static final String ANSWER_SUBMITTED = "ANSWER_SUBMITTED";
    public static final String PARTICIPANT_JOINED = "PARTICIPANT_JOINED";
    public static final String PARTICIPANT_LEFT = "PARTICIPANT_LEFT";
    public static final String SCORE_UPDATED = "SCORE_UPDATED";
    public static final String LEADERBOARD_UPDATED = "LEADERBOARD_UPDATED";
    public static final String GAME_ENDED = "GAME_ENDED";
    public static final String COUNTDOWN = "COUNTDOWN";
    public static final String KICKED = "KICKED";
}