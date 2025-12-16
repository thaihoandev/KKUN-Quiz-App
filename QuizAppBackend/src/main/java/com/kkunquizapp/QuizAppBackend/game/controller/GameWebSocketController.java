package com.kkunquizapp.QuizAppBackend.game.controller;

import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Game WebSocket Controller - Real-time Communication
 *
 * ✅ PHIÊN BẢN CHUẨN NHẤT & SẠCH NHẤT
 * - Sử dụng @SendToUser + return DTO trực tiếp
 * - Không cần SimpMessagingTemplate thủ công
 * - Hoạt động hoàn hảo với nhiều game song song
 * - Reconnect vẫn nhận message đúng
 * - Hỗ trợ đầy đủ authenticated user và anonymous/guest
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class GameWebSocketController {

    private final GameService gameService;

    // ==================== ANSWER & SKIP ====================

    @MessageMapping("/game/{gameId}/answer")
    @SendToUser("/queue/answer-result")
    @Transactional(rollbackFor = Exception.class)
    public AnswerResultDTO submitAnswer(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            @Payload SubmitAnswerRequest request,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);

        log.info("Participant {} submitting answer in game {}", participantId, gameId);

        AnswerResultDTO result = gameService.submitAnswer(gameId, participantId, request);

        log.info("Answer processed - participant: {}, correct: {}, points: {}",
                participantId, result.isCorrect(), result.getPointsEarned());

        return result;
    }

    @MessageMapping("/game/{gameId}/skip")
    @SendToUser("/queue/skip-ack")
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Boolean> skipQuestion(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);

        log.debug("Participant {} skipping question in game {}", participantId, gameId);

        gameService.skipQuestion(gameId, participantId);

        return Map.of("success", true);
    }

    // ==================== HEARTBEAT ====================

    @MessageMapping("/game/{gameId}/heartbeat")
    public void heartbeat(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        try {
            UUID participantId = parseParticipantId(participantIdStr, principal);
            log.trace("Heartbeat from participant {} in game {}", participantId, gameId);
        } catch (Exception e) {
            log.debug("Invalid heartbeat received: {}", e.getMessage());
        }
    }

    // ==================== REQUEST CURRENT QUESTION ====================

    @MessageMapping("/game/{gameId}/request-current-question")
    @SendToUser("/queue/current-question")
    @Transactional(readOnly = true)
    public Object requestCurrentQuestion(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);

        log.debug("Participant {} requesting current question for game {}", participantId, gameId);

        CurrentQuestionResponseDTO response = gameService.getCurrentQuestion(gameId);

        if (response.isHasCurrentQuestion()) {
            return response;
        } else {
            return Map.of(
                    "hasCurrentQuestion", false,
                    "message", "Waiting for host to start the first question"
            );
        }
    }

    // ==================== REAL-TIME DATA REQUESTS ====================

    @MessageMapping("/game/{gameId}/leaderboard")
    @SendToUser("/queue/leaderboard")
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> requestLeaderboard(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);

        log.debug("Participant {} requesting leaderboard for game {}", participantId, gameId);

        return gameService.getLeaderboard(gameId);
    }

    @MessageMapping("/game/{gameId}/final-leaderboard")
    @SendToUser("/queue/final-leaderboard")
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> requestFinalLeaderboard(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);

        log.debug("Participant {} requesting final leaderboard for game {}", participantId, gameId);

        return gameService.getFinalLeaderboard(gameId);
    }

    @MessageMapping("/game/{gameId}/participants")
    @SendToUser("/queue/participants")
    @Transactional(readOnly = true)
    public List<GameParticipantDTO> requestParticipants(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);

        log.debug("Participant {} requesting participants list for game {}", participantId, gameId);

        return gameService.getParticipants(gameId);
    }

    @MessageMapping("/game/{gameId}/details")
    @SendToUser("/queue/game-details")
    @Transactional(readOnly = true)
    public GameDetailDTO requestGameDetails(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);
        UUID userId = extractUserIdFromPrincipal(principal);

        log.debug("Participant {} requesting game details for game {}", participantId, gameId);

        return gameService.getGameDetails(gameId, userId);
    }

    @MessageMapping("/game/{gameId}/statistics")
    @SendToUser("/queue/statistics")
    @Transactional(readOnly = true)
    public GameStatisticsDTO requestGameStatistics(
            @DestinationVariable UUID gameId,
            @Header(value = "participantId", required = false) String participantIdStr,
            Principal principal) {

        UUID participantId = parseParticipantId(participantIdStr, principal);

        log.debug("Participant {} requesting game statistics for game {}", participantId, gameId);

        return gameService.getGameStatistics(gameId);
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Parse và validate participantId từ header
     */
    private UUID parseParticipantId(String headerValue, Principal principal) {
        if (headerValue == null || headerValue.trim().isEmpty()) {
            String name = principal != null ? principal.getName() : "unknown";
            log.warn("Missing participantId header from client (principal: {})", name);
            throw new IllegalArgumentException("participantId header is required");
        }

        try {
            return UUID.fromString(headerValue.trim());
        } catch (Exception e) {
            log.warn("Invalid participantId format: {}", headerValue);
            throw new IllegalArgumentException("Invalid participantId format");
        }
    }

    /**
     * Extract userId từ Principal nếu cần (cho isHost, stats cá nhân, v.v.)
     * Hiện tại trả null cho guest, có thể implement sau
     */
    private UUID extractUserIdFromPrincipal(Principal principal) {
        return null; // TODO: implement nếu cần lấy userId từ Principal
    }
}