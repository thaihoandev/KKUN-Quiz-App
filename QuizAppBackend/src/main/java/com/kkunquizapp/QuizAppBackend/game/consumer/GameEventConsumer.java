package com.kkunquizapp.QuizAppBackend.game.consumer;

import com.kkunquizapp.QuizAppBackend.game.event.GameEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Kafka Consumer for Game Events
 *
 * Consumes game events from Kafka and broadcasts to WebSocket clients
 *
 * Responsibilities:
 * - Consume game events from Kafka topic
 * - Broadcast events to game rooms (/topic/game/{gameId})
 * - Send user-specific notifications (/queue/*)
 * - Handle specific event types with custom logic
 * - Manage real-time updates (leaderboard, participants, etc.)
 *
 * Event Flow:
 * 1. GameService publishes event to Kafka
 * 2. GameEventConsumer consumes the event
 * 3. Event is broadcasted to WebSocket clients
 * 4. Specific event handlers perform custom logic
 * 5. Additional notifications sent if needed
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GameEventConsumer {

    private final SimpMessagingTemplate messagingTemplate;

    // ==================== KAFKA LISTENER ====================

    /**
     * Main Kafka listener - consumes game events
     *
     * Topic: ${app.kafka.topics.game-events}
     * GroupId: game-websocket-group
     * Concurrency: 3 (handle 3 events in parallel)
     */
    @KafkaListener(
            topics = "${app.kafka.topics.game-events}",
            groupId = "game-websocket-group",
            concurrency = "3"
    )
    public void consumeGameEvent(GameEvent event) {
        try {
            if (event == null || event.getGameId() == null) {
                log.warn("Received null or invalid game event");
                return;
            }

            log.debug("Consuming event: {} for game: {} (userId: {})",
                    event.getEventType(), event.getGameId(), event.getUserId());

            // 1. Broadcast to all participants in the game room
            broadcastToGameRoom(event);

            // 2. Send user-specific notifications if userId is present
            if (event.getUserId() != null) {
                sendToUser(event);
            }

            // 3. Handle specific event types with custom logic
            handleSpecificEventTypes(event);

            log.debug("Event {} processed successfully for game {}",
                    event.getEventType(), event.getGameId());

        } catch (Exception e) {
            log.error("Failed to process event {} for game {}: {}",
                    event != null ? event.getEventType() : "unknown",
                    event != null ? event.getGameId() : "unknown",
                    e.getMessage(), e);
        }
    }

    // ==================== BROADCAST METHODS ====================

    /**
     * Broadcast event to all clients subscribed to game room
     * Destination: /topic/game/{gameId}
     *
     * All players in the game receive this notification
     */
    private void broadcastToGameRoom(GameEvent event) {
        String destination = "/topic/game/" + event.getGameId();

        try {
            messagingTemplate.convertAndSend(destination, event);
            log.trace("Broadcasted {} to {}", event.getEventType(), destination);
        } catch (Exception e) {
            log.error("Failed to broadcast to game room {}: {}",
                    event.getGameId(), e.getMessage());
        }
    }

    /**
     * Send event to specific user
     * Destination: /user/{userId}/queue/game-updates
     *
     * Only the specified user receives this notification
     */
    private void sendToUser(GameEvent event) {
        String userId = event.getUserId().toString();
        String destination = "/queue/game-updates";

        try {
            messagingTemplate.convertAndSendToUser(userId, destination, event);
            log.trace("Sent {} to user: {}", event.getEventType(), userId);
        } catch (Exception e) {
            log.error("Failed to send event to user {}: {}",
                    userId, e.getMessage());
        }
    }

    /**
     * Broadcast data to specific topic
     * Used for targeted broadcasts (e.g., leaderboard, participants)
     */
    private void broadcastToTopic(String destination, Object payload) {
        try {
            messagingTemplate.convertAndSend(destination, payload);
            log.trace("Broadcasted to {}", destination);
        } catch (Exception e) {
            log.error("Failed to broadcast to {}: {}", destination, e.getMessage());
        }
    }

    // ==================== EVENT TYPE HANDLERS ====================

    /**
     * Route events to specific handlers based on event type
     */
    private void handleSpecificEventTypes(GameEvent event) {
        try {
            switch (event.getEventType()) {
                case "GAME_CREATED" -> handleGameCreated(event);
                case "GAME_STARTING" -> handleGameStarting(event);
                case "GAME_STARTED" -> handleGameStarted(event);
                case "GAME_PAUSED" -> handleGamePaused(event);
                case "GAME_RESUMED" -> handleGameResumed(event);
                case "GAME_ENDED" -> handleGameEnded(event);
                case "GAME_CANCELLED" -> handleGameCancelled(event);
                case "GAME_AUTO_ENDED" -> handleGameAutoEnded(event);
                case "PARTICIPANT_JOINED" -> handleParticipantJoined(event);
                case "PARTICIPANT_LEFT" -> handleParticipantLeft(event);
                case "PARTICIPANT_KICKED" -> handleParticipantKicked(event);
                case "QUESTION_STARTED" -> handleQuestionStarted(event);
                case "QUESTION_ENDED" -> handleQuestionEnded(event);
                case "GAME_START_FAILED" -> handleGameStartFailed(event);
                default -> log.debug("No specific handler for event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error handling event type {}: {}",
                    event.getEventType(), e.getMessage(), e);
        }
    }

    // ==================== GAME LIFECYCLE HANDLERS ====================

    private void handleGameCreated(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            String pinCode = (String) data.get("pinCode");
            String quizTitle = (String) data.get("quizTitle");
            Integer totalQuestions = (Integer) data.get("totalQuestions");

            log.info("Game {} created - Quiz: {}, PIN: {}, Questions: {}",
                    event.getGameId(), quizTitle, pinCode, totalQuestions);

            // Broadcast to waiting room
            String destination = "/topic/game/" + event.getGameId() + "/created";
            broadcastToTopic(destination, Map.of(
                    "gameId", event.getGameId(),
                    "pinCode", pinCode,
                    "quizTitle", quizTitle,
                    "totalQuestions", totalQuestions
            ));
        }
    }

    private void handleGameStarting(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Integer countdown = (Integer) data.get("countdown");
            Integer totalQuestions = (Integer) data.get("totalQuestions");

            log.info("Game {} starting - Countdown: {}s, Total questions: {}",
                    event.getGameId(), countdown, totalQuestions);

            // Alert all players - game starting soon
            String destination = "/topic/game/" + event.getGameId() + "/countdown";
            broadcastToTopic(destination, Map.of(
                    "countdown", countdown,
                    "totalQuestions", totalQuestions
            ));
        }
    }

    private void handleGameStarted(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Integer totalQuestions = (Integer) data.get("totalQuestions");

            log.info("Game {} started with {} questions",
                    event.getGameId(), totalQuestions);

            // Notify all players game has started
            String destination = "/topic/game/" + event.getGameId() + "/started";
            broadcastToTopic(destination, Map.of(
                    "status", "started",
                    "totalQuestions", totalQuestions
            ));
        }
    }

    private void handleGamePaused(GameEvent event) {
        log.info("Game {} paused", event.getGameId());

        String destination = "/topic/game/" + event.getGameId() + "/status";
        broadcastToTopic(destination, Map.of("status", "paused"));
    }

    private void handleGameResumed(GameEvent event) {
        log.info("Game {} resumed", event.getGameId());

        String destination = "/topic/game/" + event.getGameId() + "/status";
        broadcastToTopic(destination, Map.of("status", "resumed"));
    }

    private void handleGameEnded(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Integer totalPlayers = (Integer) data.get("totalPlayers");
            Double averageScore = (Double) data.get("averageScore");

            log.info("Game {} ended - Players: {}, Average score: {}",
                    event.getGameId(), totalPlayers, averageScore);

            // Broadcast final leaderboard
            if (data.containsKey("leaderboard")) {
                String leaderboardDestination = "/topic/game/" + event.getGameId() + "/final-leaderboard";
                broadcastToTopic(leaderboardDestination, data.get("leaderboard"));
            }

            // Send game ended notification
            String endedDestination = "/topic/game/" + event.getGameId() + "/ended";
            broadcastToTopic(endedDestination, Map.of(
                    "status", "ended",
                    "totalPlayers", totalPlayers,
                    "averageScore", averageScore
            ));
        }
    }

    private void handleGameCancelled(GameEvent event) {
        Map<String, Object> data = event.getData();
        String reason = data != null ? (String) data.get("reason") : "Unknown reason";

        log.info("Game {} cancelled - Reason: {}", event.getGameId(), reason);

        String destination = "/topic/game/" + event.getGameId() + "/cancelled";
        broadcastToTopic(destination, Map.of(
                "status", "cancelled",
                "reason", reason
        ));
    }

    private void handleGameAutoEnded(GameEvent event) {
        Map<String, Object> data = event.getData();
        String reason = data != null ? (String) data.get("reason") : "Unknown reason";

        log.warn("Game {} auto-ended - Reason: {}", event.getGameId(), reason);

        String destination = "/topic/game/" + event.getGameId() + "/auto-ended";
        broadcastToTopic(destination, Map.of(
                "status", "auto-ended",
                "reason", reason
        ));
    }

    private void handleGameStartFailed(GameEvent event) {
        Map<String, Object> data = event.getData();
        String error = data != null ? (String) data.get("error") : "Unknown error";

        log.error("Game {} start failed - Error: {}", event.getGameId(), error);

        String destination = "/topic/game/" + event.getGameId() + "/start-failed";
        broadcastToTopic(destination, Map.of(
                "status", "start-failed",
                "error", error
        ));
    }

    // ==================== PARTICIPANT HANDLERS ====================

    private void handleParticipantJoined(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Object participantId = data.get("participantId");
            String nickname = (String) data.get("nickname");
            Boolean isAnonymous = (Boolean) data.get("isAnonymous");
            Integer playerCount = (Integer) data.get("playerCount");

            log.info("Player {} joined game {} (total: {}, anonymous: {})",
                    nickname, event.getGameId(), playerCount, isAnonymous);

            // Update participants list for all players
            String destination = "/topic/game/" + event.getGameId() + "/player-joined";
            broadcastToTopic(destination, Map.of(
                    "participantId", participantId,
                    "nickname", nickname,
                    "isAnonymous", isAnonymous,
                    "playerCount", playerCount
            ));
        }
    }

    private void handleParticipantLeft(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Object participantId = data.get("participantId");
            String nickname = (String) data.get("nickname");
            Integer playerCount = (Integer) data.get("playerCount");

            log.info("Player {} left game {} (remaining: {})",
                    nickname, event.getGameId(), playerCount);

            String destination = "/topic/game/" + event.getGameId() + "/player-left";
            broadcastToTopic(destination, Map.of(
                    "participantId", participantId,
                    "nickname", nickname,
                    "playerCount", playerCount
            ));
        }
    }

    private void handleParticipantKicked(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Object participantId = data.get("participantId");
            String nickname = (String) data.get("nickname");
            String reason = (String) data.get("reason");
            Integer playerCount = (Integer) data.get("playerCount");

            log.info("Participant {} ({}) kicked from game {} - Reason: {}",
                    participantId, nickname, event.getGameId(), reason);

            // Send direct notification to kicked player
            String kickDestination = "/topic/game/" + event.getGameId() + "/kick/" + participantId;
            broadcastToTopic(kickDestination, Map.of(
                    "kicked", true,
                    "reason", reason,
                    "nickname", nickname
            ));

            // Notify others
            String otherDestination = "/topic/game/" + event.getGameId() + "/player-kicked";
            broadcastToTopic(otherDestination, Map.of(
                    "participantId", participantId,
                    "nickname", nickname,
                    "reason", reason,
                    "playerCount", playerCount
            ));
        }
    }

    // ==================== QUESTION HANDLERS ====================

    private void handleQuestionStarted(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Object question = data.get("question");
            Integer questionNumber = (Integer) data.get("questionNumber");
            Integer totalQuestions = (Integer) data.get("totalQuestions");
            Integer timeLimit = (Integer) data.get("timeLimit");

            log.info("Question {}/{} started - Time limit: {}s",
                    questionNumber, totalQuestions, timeLimit);

            // Broadcast new question to all players
            String destination = "/topic/game/" + event.getGameId() + "/question";
            broadcastToTopic(destination, Map.of(
                    "question", question,
                    "questionNumber", questionNumber,
                    "totalQuestions", totalQuestions,
                    "timeLimit", timeLimit
            ));
        }
    }

    private void handleQuestionEnded(GameEvent event) {
        Map<String, Object> data = event.getData();
        if (data != null) {
            Object leaderboard = data.get("leaderboard");
            Object correctAnswer = data.get("correctAnswer");
            Integer questionNumber = (Integer) data.get("questionNumber");

            log.debug("Question {} ended - Broadcasting leaderboard and answer",
                    questionNumber);

            // Broadcast updated leaderboard
            String leaderboardDestination = "/topic/game/" + event.getGameId() + "/leaderboard";
            if (leaderboard != null) {
                broadcastToTopic(leaderboardDestination, leaderboard);
            }

            // Broadcast correct answer
            String answerDestination = "/topic/game/" + event.getGameId() + "/answer";
            broadcastToTopic(answerDestination, Map.of(
                    "questionNumber", questionNumber,
                    "correctAnswer", correctAnswer
            ));
        }
    }

    // ==================== HEALTH CHECK ====================

    /**
     * Monitor consumer health
     * Can be extended with metrics/monitoring
     */
    public void logConsumerStatus() {
        log.info("GameEventConsumer is running and listening to Kafka topics");
    }
}