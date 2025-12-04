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
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/games")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Game Management", description = "Real-time multiplayer quiz game APIs (like Kahoot)")
public class GameController {

    private final GameService gameService;

    // ===================== HOST ACTIONS (yêu cầu đăng nhập) =====================

    @PostMapping("/create")
    @Operation(summary = "Tạo game mới từ quiz", description = "Chỉ host mới được tạo game")
    public ResponseEntity<GameResponseDTO> createGame(
            @Valid @RequestBody GameCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} creating new game from quizId: {}", currentUser.getUserId(), request.getQuizId());
        GameResponseDTO game = gameService.createGame(request, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(game);
    }

    @PostMapping("/{gameId}/start")
    @Operation(summary = "Bắt đầu game", description = "Host bấm Start → countdown 3s")
    public ResponseEntity<ApiResponseDTO> startGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} starting game {}", currentUser.getUserId(), gameId);
        gameService.startGame(gameId, currentUser.getUserId());
        return ResponseEntity.ok(new ApiResponseDTO(true, "Game started"));
    }

    @PostMapping("/{gameId}/pause")
    @Operation(summary = "Tạm dừng game")
    public ResponseEntity<ApiResponseDTO> pauseGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} pausing game {}", currentUser.getUserId(), gameId);
        gameService.pauseGame(gameId, currentUser.getUserId());
        return ResponseEntity.ok(new ApiResponseDTO(true, "Game paused"));
    }

    @PostMapping("/{gameId}/resume")
    @Operation(summary = "Tiếp tục game sau khi pause")
    public ResponseEntity<ApiResponseDTO> resumeGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} resuming game {}", currentUser.getUserId(), gameId);
        gameService.resumeGame(gameId, currentUser.getUserId());
        return ResponseEntity.ok(new ApiResponseDTO(true, "Game resumed"));
    }

    @PostMapping("/{gameId}/next-question")
    @Operation(summary = "Chuyển sang câu hỏi tiếp theo")
    public ResponseEntity<QuestionResponseDTO> nextQuestion(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} moving to next question in game {}", currentUser.getUserId(), gameId);
        QuestionResponseDTO question = gameService.moveToNextQuestion(gameId, currentUser.getUserId());
        return ResponseEntity.ok(question);
    }

    @PostMapping("/{gameId}/end")
    @Operation(summary = "Kết thúc game", description = "Host bấm End Game → hiện bảng xếp hạng cuối")
    public ResponseEntity<ApiResponseDTO> endGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} ending game {}", currentUser.getUserId(), gameId);
        gameService.endGame(gameId, currentUser.getUserId());
        return ResponseEntity.ok(new ApiResponseDTO(true, "Game ended"));
    }

    @PostMapping("/{gameId}/cancel")
    @Operation(summary = "Hủy game", description = "Khi chưa bắt đầu hoặc muốn hủy")
    public ResponseEntity<ApiResponseDTO> cancelGame(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} cancelling game {}", currentUser.getUserId(), gameId);
        gameService.cancelGame(gameId, currentUser.getUserId());
        return ResponseEntity.ok(new ApiResponseDTO(true, "Game cancelled"));
    }

    @PostMapping("/{gameId}/kick/{participantId}")
    @Operation(summary = "Kick người chơi khỏi phòng")
    public ResponseEntity<ApiResponseDTO> kickParticipant(
            @PathVariable UUID gameId,
            @PathVariable UUID participantId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} kicking participant {} from game {}", currentUser.getUserId(), participantId, gameId);
        gameService.kickParticipant(gameId, participantId, currentUser.getUserId(), reason != null ? reason : "Kicked by host");
        return ResponseEntity.ok(new ApiResponseDTO(true, "Player kicked"));
    }

    // ===================== PLAYER ACTIONS (có thể guest hoặc đăng nhập) =====================

    @PostMapping("/join")
    @Operation(summary = "Tham gia game bằng PIN (đã đăng nhập)", description = "Người chơi có tài khoản")
    public ResponseEntity<GameParticipantDTO> joinGameAuthenticated(
            @RequestParam String pinCode,
            @Valid @RequestBody JoinGameRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("User {} joining game with PIN: {}", currentUser.getUserId(), pinCode);
        GameParticipantDTO participant = gameService.joinGame(pinCode, request, currentUser.getUserId());
        return ResponseEntity.ok(participant);
    }

    @PostMapping("/join-anonymous")
    @Operation(summary = "Tham gia game ẩn danh", description = "Không cần đăng nhập, trả về guestToken")
    public ResponseEntity<GameParticipantDTO> joinGameAnonymous(
            @RequestParam String pinCode,
            @Valid @RequestBody JoinGameRequest request) {

        log.info("Anonymous player joining with PIN: {}", pinCode);
        GameParticipantDTO participant = gameService.joinGameAnonymous(pinCode, request);
        return ResponseEntity.ok(participant);
    }

    @PostMapping("/{gameId}/answer")
    @Operation(summary = "Nộp câu trả lời", description = "Cả guest và user đều dùng được")
    public ResponseEntity<AnswerResultDTO> submitAnswer(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId, // FE gửi qua header
            @Valid @RequestBody SubmitAnswerRequest request) {

        log.debug("Participant {} submitting answer in game {}", participantId, gameId);
        AnswerResultDTO result = gameService.submitAnswer(gameId, participantId, request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{gameId}/skip")
    @Operation(summary = "Bỏ qua câu hỏi")
    public ResponseEntity<ApiResponseDTO> skipQuestion(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId) {

        log.debug("Participant {} skipping question in game {}", participantId, gameId);
        gameService.skipQuestion(gameId, participantId);
        return ResponseEntity.ok(new ApiResponseDTO(true, "Question skipped"));
    }

    @PostMapping("/{gameId}/leave")
    @Operation(summary = "Rời phòng chơi")
    public ResponseEntity<ApiResponseDTO> leaveGame(
            @PathVariable UUID gameId,
            @RequestHeader("X-Participant-Id") UUID participantId) {

        log.info("Participant {} leaving game {}", participantId, gameId);
        gameService.leaveGame(gameId, participantId);
        return ResponseEntity.ok(new ApiResponseDTO(true, "Left game"));
    }

    // ===================== PUBLIC INFO ENDPOINTS =====================

    @GetMapping("/pin/{pinCode}")
    @Operation(summary = "Lấy thông tin game bằng PIN", description = "Dùng cho màn hình chờ tham gia")
    public ResponseEntity<GameResponseDTO> getGameByPin(@PathVariable String pinCode) {
        log.info("Fetching game info by PIN: {}", pinCode);
        GameResponseDTO game = gameService.getGameByPin(pinCode);
        return ResponseEntity.ok(game);
    }


    @GetMapping("/{gameId}")
    @Operation(summary = "Lấy chi tiết game (host & player đều xem được)")
    public ResponseEntity<GameDetailDTO> getGameDetails(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        UUID userId = currentUser != null ? currentUser.getUserId() : null;
        GameDetailDTO detail = gameService.getGameDetails(gameId, userId);
        return ResponseEntity.ok(detail);
    }

    @GetMapping("/{gameId}/participants")
    @Operation(summary = "Lấy danh sách người chơi trong phòng")
    public ResponseEntity<List<GameParticipantDTO>> getParticipants(@PathVariable UUID gameId) {
        List<GameParticipantDTO> participants = gameService.getParticipants(gameId);
        return ResponseEntity.ok(participants);
    }

    @GetMapping("/{gameId}/leaderboard")
    @Operation(summary = "Bảng xếp hạng realtime")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(@PathVariable UUID gameId) {
        List<LeaderboardEntryDTO> leaderboard = gameService.getLeaderboard(gameId);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/{gameId}/final-leaderboard")
    @Operation(summary = "Bảng xếp hạng cuối cùng sau khi end game")
    public ResponseEntity<List<LeaderboardEntryDTO>> getFinalLeaderboard(@PathVariable UUID gameId) {
        List<LeaderboardEntryDTO> leaderboard = gameService.getFinalLeaderboard(gameId);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/my-games")
    @Operation(summary = "Lịch sử game host đã tạo")
    public ResponseEntity<Page<GameResponseDTO>> getMyGames(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GameResponseDTO> games = gameService.getMyGames(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(games);
    }

    @GetMapping("/{gameId}/statistics")
    @Operation(summary = "Thống kê chi tiết game (cho host)")
    public ResponseEntity<GameStatisticsDTO> getGameStatistics(
            @PathVariable UUID gameId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("Host {} viewing statistics for game {}", currentUser.getUserId(), gameId);
        GameStatisticsDTO stats = gameService.getGameStatistics(gameId);
        return ResponseEntity.ok(stats);
    }
}