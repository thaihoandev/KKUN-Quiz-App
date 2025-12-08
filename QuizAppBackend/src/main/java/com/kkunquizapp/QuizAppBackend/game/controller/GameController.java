package com.kkunquizapp.QuizAppBackend.game.controller;

import com.kkunquizapp.QuizAppBackend.common.dto.ApiResponseDTO;
import com.kkunquizapp.QuizAppBackend.game.dto.*;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Game Management", description = "Real-time multiplayer quiz game (Kahoot-style)")
public class GameController {

    private final GameService gameService;

    // ===================== HOST ACTIONS =====================

    @PostMapping("/create")
    @Operation(summary = "Tạo game mới từ quiz")
    public ResponseEntity<GameResponseDTO> createGame(
            @Valid @RequestBody GameCreateRequest request,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} creating game for quiz {}", host.getUserId(), request.getQuizId());
        GameResponseDTO game = gameService.createGame(request, host.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(game);
    }

    @PostMapping("/{gameId}/start")
    @Operation(summary = "Bắt đầu game (countdown 3s)")
    public ApiResponseDTO startGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} starting game {}", host.getUserId(), gameId);
        gameService.startGame(gameId, host.getUserId());
        return ApiResponseDTO.success("Game starting in 3 seconds...");
    }

    @PostMapping("/{gameId}/pause")
    @Operation(summary = "Tạm dừng game")
    public ApiResponseDTO pauseGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} pausing game {}", host.getUserId(), gameId);
        gameService.pauseGame(gameId, host.getUserId());
        return ApiResponseDTO.success("Game paused");
    }

    @PostMapping("/{gameId}/resume")
    @Operation(summary = "Tiếp tục game")
    public ApiResponseDTO resumeGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} resuming game {}", host.getUserId(), gameId);
        gameService.resumeGame(gameId, host.getUserId());
        return ApiResponseDTO.success("Game resumed");
    }

    @PostMapping("/{gameId}/next-question")
    @Operation(summary = "Chuyển sang câu hỏi tiếp theo (host bấm)")
    public ResponseEntity<QuestionResponseDTO> nextQuestion(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} moving to next question in game {}", host.getUserId(), gameId);
        QuestionResponseDTO question = gameService.moveToNextQuestion(gameId, host.getUserId());
        return ResponseEntity.ok(question);
    }

    @PostMapping("/{gameId}/end")
    @Operation(summary = "Kết thúc game → hiện bảng xếp hạng cuối")
    public ApiResponseDTO endGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} ending game {}", host.getUserId(), gameId);
        gameService.endGame(gameId, host.getUserId());
        return ApiResponseDTO.success("Game ended. Final leaderboard sent.");
    }

    @PostMapping("/{gameId}/cancel")
    @Operation(summary = "Hủy game (chưa bắt đầu hoặc lỗi)")
    public ApiResponseDTO cancelGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} cancelling game {}", host.getUserId(), gameId);
        gameService.cancelGame(gameId, host.getUserId());
        return ApiResponseDTO.success("Game cancelled");
    }

    @PostMapping("/{gameId}/kick/{participantId}")
    @Operation(summary = "Kick người chơi")
    public ApiResponseDTO kickParticipant(
            @PathVariable UUID gameId,
            @PathVariable UUID participantId,
            @RequestParam(defaultValue = "Kicked by host") String reason,
            @AuthenticationPrincipal UserPrincipal host) {

        log.info("Host {} kicking participant {} from game {}", host.getUserId(), participantId, gameId);
        gameService.kickParticipant(gameId, participantId, host.getUserId(), reason);
        return ApiResponseDTO.success("Player kicked");
    }

    // ===================== PLAYER ACTIONS =====================

    @PostMapping("/join")
    @Operation(summary = "Tham gia game (đã đăng nhập)")
    public GameParticipantDTO joinGame(
            @RequestParam String pinCode,
            @Valid @RequestBody JoinGameRequest request,
            @AuthenticationPrincipal UserPrincipal user) {

        log.info("User {} joining game with PIN {}", user.getUserId(), pinCode);
        return gameService.joinGame(pinCode, request, user.getUserId());
    }

    @PostMapping("/join-anonymous")
    @Operation(summary = "Tham gia ẩn danh (không cần login)")
    public GameParticipantDTO joinGameAnonymous(
            @RequestParam String pinCode,
            @Valid @RequestBody JoinGameRequest request) {

        log.info("Anonymous user joining game with PIN {}", pinCode);
        return gameService.joinGameAnonymous(pinCode, request);
    }

    @PostMapping("/{gameId}/answer")
    @Operation(summary = "Nộp câu trả lời (cả user và guest)")
    public AnswerResultDTO submitAnswer(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId,
            @Valid @RequestBody SubmitAnswerRequest request) {

        log.debug("Participant {} submitting answer for game {}", participantId, gameId);
        return gameService.submitAnswer(gameId, participantId, request);
    }

    @PostMapping("/{gameId}/skip")
    @Operation(summary = "Bỏ qua câu hỏi")
    public ApiResponseDTO skipQuestion(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId) {

        log.debug("Participant {} skipping question in game {}", participantId, gameId);
        gameService.skipQuestion(gameId, participantId);
        return ApiResponseDTO.success("Question skipped");
    }

    @PostMapping("/{gameId}/leave")
    @Operation(summary = "Rời phòng chơi")
    public ApiResponseDTO leaveGame(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId) {

        log.info("Participant {} leaving game {}", participantId, gameId);
        gameService.leaveGame(gameId, participantId);
        return ApiResponseDTO.success("Left game successfully");
    }

    // ===================== PUBLIC ENDPOINTS =====================

    @GetMapping("/pin/{pinCode}")
    @Operation(summary = "Lấy thông tin game bằng PIN (màn hình chờ)")
    public GameResponseDTO getGameByPin(@PathVariable String pinCode) {
        log.debug("Fetching game info by PIN: {}", pinCode);
        return gameService.getGameByPin(pinCode);
    }

    @GetMapping("/{gameId}")
    @Operation(summary = "Chi tiết game (host + player)")
    public GameDetailDTO getGameDetails(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal user) {

        UUID userId = user != null ? user.getUserId() : null;
        log.debug("Fetching game details for gameId: {}", gameId);
        return gameService.getGameDetails(gameId, userId);
    }

    @GetMapping("/{gameId}/participants")
    @Operation(summary = "Danh sách người chơi hiện tại")
    public List<GameParticipantDTO> getParticipants(@PathVariable UUID gameId) {
        log.debug("Fetching participants for game {}", gameId);
        return gameService.getParticipants(gameId);
    }

    @GetMapping("/{gameId}/leaderboard")
    @Operation(summary = "Bảng xếp hạng realtime")
    public List<LeaderboardEntryDTO> getLeaderboard(@PathVariable UUID gameId) {
        log.debug("Fetching leaderboard for game {}", gameId);
        return gameService.getLeaderboard(gameId);
    }

    @GetMapping("/{gameId}/final-leaderboard")
    @Operation(summary = "Bảng xếp hạng cuối cùng")
    public List<LeaderboardEntryDTO> getFinalLeaderboard(@PathVariable UUID gameId) {
        log.debug("Fetching final leaderboard for game {}", gameId);
        return gameService.getFinalLeaderboard(gameId);
    }

    @GetMapping("/my-games")
    @Operation(summary = "Lịch sử các game đã tạo")
    public Page<GameResponseDTO> getMyGames(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Fetching games for user {}, page: {}, size: {}", user.getUserId(), page, size);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return gameService.getMyGames(user.getUserId(), pageable);
    }

    @GetMapping("/{gameId}/statistics")
    @Operation(summary = "Thống kê chi tiết game")
    public GameStatisticsDTO getStatistics(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal host) {

        log.debug("Fetching statistics for game {}", gameId);
        return gameService.getGameStatistics(gameId);
    }

    // ===================== USER STATISTICS =====================

    @GetMapping("/user/{userId}/quiz/{quizId}/stats")
    @Operation(summary = "Lấy thống kê của user với quiz cụ thể")
    public UserQuizStatsDTO getUserStatistics(
            @PathVariable UUID userId,
            @PathVariable UUID quizId) {

        log.debug("Fetching user {} statistics for quiz {}", userId, quizId);
        return gameService.getUserStatistics(userId, quizId);
    }
}