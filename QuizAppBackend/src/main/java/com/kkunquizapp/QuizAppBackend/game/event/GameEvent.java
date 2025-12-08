package com.kkunquizapp.QuizAppBackend.game.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Game Event for Kafka Streaming
 *
 * Event Types:
 * - GAME_CREATED: New game created
 * - GAME_STARTING: Game countdown started
 * - GAME_STARTED: Game actually started
 * - GAME_PAUSED: Game paused by host
 * - GAME_RESUMED: Game resumed
 * - GAME_ENDED: Game finished
 * - GAME_CANCELLED: Game cancelled
 * - PARTICIPANT_JOINED: Player joined
 * - PARTICIPANT_LEFT: Player left
 * - PARTICIPANT_KICKED: Player kicked by host
 * - QUESTION_STARTED: New question broadcasted
 * - QUESTION_ENDED: Question time ended, show results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameEvent {

    private UUID gameId;

    private String eventType;

    private UUID userId; // Can be null for system events

    private Map<String, Object> data; // Additional event data

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // Helper methods
    public boolean isGameLifecycleEvent() {
        return eventType.startsWith("GAME_");
    }

    public boolean isParticipantEvent() {
        return eventType.startsWith("PARTICIPANT_");
    }

    public boolean isQuestionEvent() {
        return eventType.startsWith("QUESTION_");
    }
}