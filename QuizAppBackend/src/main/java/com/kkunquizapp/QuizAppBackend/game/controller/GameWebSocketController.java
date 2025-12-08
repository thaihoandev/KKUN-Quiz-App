package com.kkunquizapp.QuizAppBackend.game.controller;

import com.kkunquizapp.QuizAppBackend.game.dto.SubmitAnswerRequest;
import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class GameWebSocketController {

    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    // ==================== ANSWER & SKIP ====================

    /**
     * Xử lý submit answer qua WebSocket
     * Endpoint: /app/game/{gameId}/answer
     */
    @MessageMapping("/game/{gameId}/answer")
    public void submitAnswer(
            @DestinationVariable UUID gameId,
            @Header("participantId") String participantIdStr,
            @Payload SubmitAnswerRequest request,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);
        String username = getUsername(principal);

        try {
            log.debug("Processing answer for participant {} in game {}", participantId, gameId);
            var result = gameService.submitAnswer(gameId, participantId, request);

            // Gửi kết quả riêng cho người chơi
            sendToUser(username, "/queue/answer-result", result);
            log.debug("Answer result sent to user {}", username);

        } catch (Exception e) {
            log.warn("Failed to process answer - participant: {}, game: {}, error: {}",
                    participantId, gameId, e.getMessage());
            sendToUser(username, "/queue/errors", Map.of(
                    "error", e.getMessage(),
                    "type", "ANSWER_FAILED"
            ));
        }
    }

    /**
     * Xử lý skip question qua WebSocket
     * Endpoint: /app/game/{gameId}/skip
     */
    @MessageMapping("/game/{gameId}/skip")
    public void skipQuestion(
            @DestinationVariable UUID gameId,
            @Header("participantId") String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);
        String username = getUsername(principal);

        try {
            log.debug("Processing skip for participant {} in game {}", participantId, gameId);
            gameService.skipQuestion(gameId, participantId);

            sendToUser(username, "/queue/skip-ack", Map.of("success", true));
            log.debug("Skip acknowledgment sent to user {}", username);

        } catch (Exception e) {
            log.warn("Failed to skip question - participant: {}, game: {}, error: {}",
                    participantId, gameId, e.getMessage());
            sendToUser(username, "/queue/errors", Map.of(
                    "error", e.getMessage(),
                    "type", "SKIP_FAILED"
            ));
        }
    }

    // ==================== HEARTBEAT ====================

    /**
     * Heartbeat để track active players
     * Endpoint: /app/game/{gameId}/heartbeat
     */
    @MessageMapping("/game/{gameId}/heartbeat")
    public void heartbeat(
            @DestinationVariable UUID gameId,
            @Header("participantId") String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);
        log.trace("Heartbeat from game {} - participant {}", gameId, participantId);
        // Có thể lưu lastSeenAt vào Redis nếu cần chống fake player
    }

    // ==================== REAL-TIME DATA REQUESTS ====================

    /**
     * Request realtime leaderboard
     * Endpoint: /app/game/{gameId}/leaderboard
     */
    @MessageMapping("/game/{gameId}/leaderboard")
    public void requestLeaderboard(
            @DestinationVariable UUID gameId,
            Principal principal) {

        String username = getUsername(principal);

        try {
            log.debug("Fetching leaderboard for game {} - user {}", gameId, username);
            var leaderboard = gameService.getLeaderboard(gameId);
            sendToUser(username, "/queue/leaderboard", leaderboard);
            log.debug("Leaderboard sent to user {}", username);

        } catch (Exception e) {
            log.error("Failed to send leaderboard for game {}: {}", gameId, e.getMessage());
            sendToUser(username, "/queue/errors", Map.of(
                    "error", "Failed to fetch leaderboard",
                    "type", "LEADERBOARD_FAILED"
            ));
        }
    }

    /**
     * Request final leaderboard (sau khi game kết thúc)
     * Endpoint: /app/game/{gameId}/final-leaderboard
     */
    @MessageMapping("/game/{gameId}/final-leaderboard")
    public void requestFinalLeaderboard(
            @DestinationVariable UUID gameId,
            Principal principal) {

        String username = getUsername(principal);

        try {
            log.debug("Fetching final leaderboard for game {} - user {}", gameId, username);
            var leaderboard = gameService.getFinalLeaderboard(gameId);
            sendToUser(username, "/queue/final-leaderboard", leaderboard);
            log.debug("Final leaderboard sent to user {}", username);

        } catch (Exception e) {
            log.error("Failed to send final leaderboard for game {}: {}", gameId, e.getMessage());
            sendToUser(username, "/queue/errors", Map.of(
                    "error", "Failed to fetch final leaderboard",
                    "type", "FINAL_LEADERBOARD_FAILED"
            ));
        }
    }

    /**
     * Request danh sách người chơi hiện tại
     * Endpoint: /app/game/{gameId}/participants
     */
    @MessageMapping("/game/{gameId}/participants")
    public void requestParticipants(
            @DestinationVariable UUID gameId,
            Principal principal) {

        String username = getUsername(principal);

        try {
            log.debug("Fetching participants for game {} - user {}", gameId, username);
            var participants = gameService.getParticipants(gameId);
            sendToUser(username, "/queue/participants", participants);
            log.debug("Participants list sent to user {}", username);

        } catch (Exception e) {
            log.error("Failed to send participants for game {}: {}", gameId, e.getMessage());
            sendToUser(username, "/queue/errors", Map.of(
                    "error", "Failed to fetch participants",
                    "type", "PARTICIPANTS_FAILED"
            ));
        }
    }

    /**
     * Request chi tiết game (realtime)
     * Endpoint: /app/game/{gameId}/details
     */
    @MessageMapping("/game/{gameId}/details")
    public void requestGameDetails(
            @DestinationVariable UUID gameId,
            Principal principal) {

        String username = getUsername(principal);
        UUID userId = extractUserIdFromPrincipal(principal);

        try {
            log.debug("Fetching game details for game {} - user {}", gameId, username);
            var gameDetails = gameService.getGameDetails(gameId, userId);
            sendToUser(username, "/queue/game-details", gameDetails);
            log.debug("Game details sent to user {}", username);

        } catch (Exception e) {
            log.error("Failed to send game details for game {}: {}", gameId, e.getMessage());
            sendToUser(username, "/queue/errors", Map.of(
                    "error", "Failed to fetch game details",
                    "type", "GAME_DETAILS_FAILED"
            ));
        }
    }

    /**
     * Request thống kê game
     * Endpoint: /app/game/{gameId}/statistics
     */
    @MessageMapping("/game/{gameId}/statistics")
    public void requestGameStatistics(
            @DestinationVariable UUID gameId,
            Principal principal) {

        String username = getUsername(principal);

        try {
            log.debug("Fetching statistics for game {} - user {}", gameId, username);
            var statistics = gameService.getGameStatistics(gameId);
            sendToUser(username, "/queue/statistics", statistics);
            log.debug("Statistics sent to user {}", username);

        } catch (Exception e) {
            log.error("Failed to send statistics for game {}: {}", gameId, e.getMessage());
            sendToUser(username, "/queue/errors", Map.of(
                    "error", "Failed to fetch game statistics",
                    "type", "STATISTICS_FAILED"
            ));
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Parse participantId từ header
     *
     * @param headerValue giá trị từ header
     * @param principal principal từ WebSocket connection
     * @return UUID của participant
     * @throws IllegalArgumentException nếu format không hợp lệ
     */
    private UUID parseParticipantId(String headerValue, Principal principal) {
        try {
            if (headerValue == null || headerValue.isEmpty()) {
                throw new IllegalArgumentException("Participant ID header is empty");
            }
            return UUID.fromString(headerValue);
        } catch (IllegalArgumentException e) {
            String username = getUsername(principal);
            log.warn("Invalid participantId header from user {}: {}", username, headerValue);
            throw new IllegalArgumentException("Invalid participant ID format: " + headerValue);
        }
    }

    /**
     * Lấy username từ Principal
     * Hỗ trợ cả authenticated users và anonymous users
     *
     * @param principal Principal object từ WebSocket
     * @return username hoặc "anonymous" nếu không có
     */
    private String getUsername(Principal principal) {
        if (principal != null && principal.getName() != null && !principal.getName().isEmpty()) {
            return principal.getName();
        }
        return "anonymous";
    }

    /**
     * Extract userId từ Principal (nếu có)
     * Phải match với cách bạn set UserPrincipal
     *
     * @param principal Principal object từ WebSocket
     * @return UUID của user hoặc null nếu anonymous
     */
    private UUID extractUserIdFromPrincipal(Principal principal) {
        // Nếu bạn dùng UserPrincipal, cast và lấy userId
        // Ví dụ: if (principal instanceof UserPrincipal) { return ((UserPrincipal) principal).getUserId(); }
        // Hiện tại trả về null vì WebSocket thường chỉ có username
        return null;
    }

    /**
     * Gửi message đến một user cụ thể via queue
     * Hỗ trợ cả authenticated users và anonymous users
     *
     * @param username username của người dùng (hoặc "anonymous")
     * @param destination destination queue (e.g., "/queue/answer-result")
     * @param payload dữ liệu cần gửi
     */
    private void sendToUser(String username, String destination, Object payload) {
        if (username == null || username.isEmpty() || "anonymous".equals(username)) {
            log.warn("Cannot send message to empty username or anonymous user");
            return;
        }

        try {
            messagingTemplate.convertAndSendToUser(username, destination, payload);
            log.trace("Message sent to user {} at destination {}", username, destination);
        } catch (Exception e) {
            log.error("Failed to send message to user {} at {}: {}", username, destination, e.getMessage());
        }
    }

    /**
     * Broadcast message đến tất cả users trong game qua topic
     * Dùng cho các sự kiện cần thông báo rộng rãi
     *
     * @param gameId ID của game
     * @param destination destination topic (e.g., "/topic/game-updates")
     * @param payload dữ liệu cần gửi
     */
    private void broadcastToGame(UUID gameId, String destination, Object payload) {
        try {
            String topic = "/topic/game/" + gameId + destination;
            messagingTemplate.convertAndSend(topic, payload);
            log.debug("Broadcast to game {} at {}", gameId, destination);
        } catch (Exception e) {
            log.error("Failed to broadcast to game {}: {}", gameId, e.getMessage());
        }
    }
}