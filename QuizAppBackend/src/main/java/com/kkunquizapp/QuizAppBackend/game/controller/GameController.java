package com.kkunquizapp.QuizAppBackend.game.controller;

import com.kkunquizapp.QuizAppBackend.common.dto.ApiResponseDTO;
import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.service.GameScheduler;
import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Game Controller - REST API for Quiz Game Management
 *
 * Cập nhật:
 * - ✅ Sử dụng @Transactional(readOnly=true) cho read operations
 * - ✅ Proper error handling
 * - ✅ Consistent with fixed GameService
 */
@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Game Management", description = "Real-time multiplayer quiz game (Kahoot-style)")
public class GameController {

    private final GameService gameService;
    private final GameScheduler gameScheduler;
    private final TaskScheduler taskScheduler;

    // ===================== HOST ACTIONS =====================

    @PostMapping("/create")
    @Operation(summary = "Tạo game mới từ quiz")
    @Transactional
    public ResponseEntity<GameResponseDTO> createGame(
            @Valid @RequestBody GameCreateRequest request,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} creating game for quiz {}", host.getUserId(), request.getQuizId());
        GameResponseDTO game = gameService.createGame(request, host.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(game);
    }

    @PostMapping("/{gameId}/start")
    @Operation(summary = "Bắt đầu game (host bấm Start)")
    @Transactional
    public ResponseEntity<ApiResponseDTO> startGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} starting game {}", host.getUserId(), gameId);

        // ✅ Gọi startGame() đã được sửa: đổi luôn thành IN_PROGRESS + gửi GAME_STARTED
        gameService.startGame(gameId, host.getUserId());

        return ResponseEntity.ok(ApiResponseDTO.success("Game starting in 3 seconds..."));
    }

    @PostMapping("/{gameId}/pause")
    @Operation(summary = "Tạm dừng game")
    @Transactional
    public ResponseEntity<ApiResponseDTO> pauseGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} pausing game {}", host.getUserId(), gameId);
        gameService.pauseGame(gameId, host.getUserId());
        return ResponseEntity.ok(ApiResponseDTO.success("Game paused"));
    }

    @PostMapping("/{gameId}/resume")
    @Operation(summary = "Tiếp tục game")
    @Transactional
    public ResponseEntity<ApiResponseDTO> resumeGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} resuming game {}", host.getUserId(), gameId);
        gameService.resumeGame(gameId, host.getUserId());
        return ResponseEntity.ok(ApiResponseDTO.success("Game resumed"));
    }

    /**
     * Host bấm "Next Question" → chuyển sang câu tiếp theo
     *
     * Flow:
     * 1. Gọi moveToNextQuestion()
     *    - Fetch questions với options
     *    - Di chuyển currentQuestionIndex
     *    - Broadcast câu hỏi (TRONG TRANSACTION)
     * 2. Lên lịch endQuestion() sau time limit
     */
    @PostMapping("/{gameId}/next-question")
    @Operation(summary = "Chuyển sang câu hỏi tiếp theo (host bấm)")
    @Transactional
    public ResponseEntity<QuestionResponseDTO> nextQuestion(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} moving to next question in game {}", host.getUserId(), gameId);

        try {
            // moveToNextQuestion() tự động broadcast + schedule endQuestion
            QuestionResponseDTO question = gameService.moveToNextQuestion(gameId, host.getUserId());
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            log.error("Failed to move to next question: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{gameId}/end")
    @Operation(summary = "Kết thúc game → hiện bảng xếp hạng cuối")
    @Transactional
    public ResponseEntity<ApiResponseDTO> endGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} ending game {}", host.getUserId(), gameId);
        gameService.endGame(gameId, host.getUserId());
        return ResponseEntity.ok(ApiResponseDTO.success("Game ended. Final leaderboard sent."));
    }

    @PostMapping("/{gameId}/cancel")
    @Operation(summary = "Hủy game (chưa bắt đầu hoặc lỗi)")
    @Transactional
    public ResponseEntity<ApiResponseDTO> cancelGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} cancelling game {}", host.getUserId(), gameId);
        gameService.cancelGame(gameId, host.getUserId());
        return ResponseEntity.ok(ApiResponseDTO.success("Game cancelled"));
    }

    @PostMapping("/{gameId}/kick/{participantId}")
    @Operation(summary = "Kick người chơi")
    @Transactional
    public ResponseEntity<ApiResponseDTO> kickParticipant(
            @PathVariable UUID gameId,
            @PathVariable UUID participantId,
            @RequestParam(defaultValue = "Kicked by host") String reason,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} kicking participant {} from game {}", host.getUserId(), participantId, gameId);
        gameService.kickParticipant(gameId, participantId, host.getUserId(), reason);
        return ResponseEntity.ok(ApiResponseDTO.success("Player kicked"));
    }

    // ===================== PLAYER ACTIONS =====================

    @PostMapping("/join")
    @Operation(summary = "Tham gia game (đã đăng nhập)")
    @Transactional
    public ResponseEntity<GameParticipantDTO> joinGame(
            @RequestParam String pinCode,
            @Valid @RequestBody JoinGameRequest request,
            @AuthenticationPrincipal UserPrincipal user) {

        log.info("User {} joining game with PIN {}", user.getUserId(), pinCode);
        GameParticipantDTO participant = gameService.joinGame(pinCode, request, user.getUserId());
        return ResponseEntity.ok(participant);
    }

    @PostMapping("/join-anonymous")
    @Operation(summary = "Tham gia ẩn danh (không cần login)")
    @Transactional
    public ResponseEntity<GameParticipantDTO> joinGameAnonymous(
            @RequestParam String pinCode,
            @Valid @RequestBody JoinGameRequest request) {

        log.info("Anonymous user joining game with PIN {}", pinCode);
        GameParticipantDTO participant = gameService.joinGameAnonymous(pinCode, request);
        return ResponseEntity.ok(participant);
    }

    @PostMapping("/{gameId}/answer")
    @Operation(summary = "Nộp câu trả lời (cả user và guest)")
    @Transactional
    public ResponseEntity<AnswerResultDTO> submitAnswer(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId,
            @Valid @RequestBody SubmitAnswerRequest request) {

        log.debug("Participant {} submitting answer for game {}", participantId, gameId);
        AnswerResultDTO result = gameService.submitAnswer(gameId, participantId, request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{gameId}/skip")
    @Operation(summary = "Bỏ qua câu hỏi")
    @Transactional
    public ResponseEntity<ApiResponseDTO> skipQuestion(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId) {

        log.debug("Participant {} skipping question in game {}", participantId, gameId);
        gameService.skipQuestion(gameId, participantId);
        return ResponseEntity.ok(ApiResponseDTO.success("Question skipped"));
    }

    @PostMapping("/{gameId}/leave")
    @Operation(summary = "Rời phòng chơi")
    @Transactional
    public ResponseEntity<ApiResponseDTO> leaveGame(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId) {

        log.info("Participant {} leaving game {}", participantId, gameId);
        gameService.leaveGame(gameId, participantId);
        return ResponseEntity.ok(ApiResponseDTO.success("Left game successfully"));
    }

    // ===================== PUBLIC ENDPOINTS (READ-ONLY) =====================

    @GetMapping("/pin/{pinCode}")
    @Operation(summary = "Lấy thông tin game bằng PIN (màn hình chờ)")
    @Transactional(readOnly = true)
    public ResponseEntity<GameResponseDTO> getGameByPin(@PathVariable String pinCode) {
        log.debug("Fetching game info by PIN: {}", pinCode);
        GameResponseDTO game = gameService.getGameByPin(pinCode);
        return ResponseEntity.ok(game);
    }

    @GetMapping("/{gameId}")
    @Operation(summary = "Chi tiết game (host + player)")
    @Transactional(readOnly = true)
    public ResponseEntity<GameDetailDTO> getGameDetails(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal user) {

        UUID userId = user != null ? user.getUserId() : null;
        log.debug("Fetching game details for gameId: {}, userId: {}", gameId, userId);
        GameDetailDTO details = gameService.getGameDetails(gameId, userId);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/{gameId}/participants")
    @Operation(summary = "Danh sách người chơi hiện tại")
    @Transactional(readOnly = true)
    public ResponseEntity<List<GameParticipantDTO>> getParticipants(@PathVariable UUID gameId) {
        log.debug("Fetching participants for game {}", gameId);
        List<GameParticipantDTO> participants = gameService.getParticipants(gameId);
        return ResponseEntity.ok(participants);
    }

    @GetMapping("/{gameId}/leaderboard")
    @Operation(summary = "Bảng xếp hạng realtime")
    @Transactional(readOnly = true)
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(@PathVariable UUID gameId) {
        log.debug("Fetching leaderboard for game {}", gameId);
        List<LeaderboardEntryDTO> leaderboard = gameService.getLeaderboard(gameId);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/{gameId}/final-leaderboard")
    @Operation(summary = "Bảng xếp hạng cuối cùng")
    @Transactional(readOnly = true)
    public ResponseEntity<List<LeaderboardEntryDTO>> getFinalLeaderboard(@PathVariable UUID gameId) {
        log.debug("Fetching final leaderboard for game {}", gameId);
        List<LeaderboardEntryDTO> leaderboard = gameService.getFinalLeaderboard(gameId);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/my-games")
    @Operation(summary = "Lịch sử các game đã tạo")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<GameResponseDTO>> getMyGames(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Fetching games for user {}, page: {}, size: {}", user.getUserId(), page, size);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GameResponseDTO> games = gameService.getMyGames(user.getUserId(), pageable);
        return ResponseEntity.ok(games);
    }

    @GetMapping("/{gameId}/statistics")
    @Operation(summary = "Thống kê chi tiết game")
    @Transactional(readOnly = true)
    public ResponseEntity<GameStatisticsDTO> getStatistics(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.debug("Fetching statistics for game {}", gameId);
        GameStatisticsDTO stats = gameService.getGameStatistics(gameId);
        return ResponseEntity.ok(stats);
    }

    // ===================== USER STATISTICS =====================

    @GetMapping("/user/{userId}/quiz/{quizId}/stats")
    @Operation(summary = "Lấy thống kê của user với quiz cụ thể")
    @Transactional(readOnly = true)
    public ResponseEntity<UserQuizStatsDTO> getUserStatistics(
            @PathVariable UUID userId,
            @PathVariable UUID quizId) {

        log.debug("Fetching user {} statistics for quiz {}", userId, quizId);
        UserQuizStatsDTO stats = gameService.getUserStatistics(userId, quizId);
        return ResponseEntity.ok(stats);
    }
}