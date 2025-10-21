package com.kkunquizapp.QuizAppBackend.game.controller;

import com.kkunquizapp.QuizAppBackend.common.dto.ApiResponseDTO;
import com.kkunquizapp.QuizAppBackend.fileUpload.dto.*;
import com.kkunquizapp.QuizAppBackend.game.dto.GameDetailsResponseDTO;
import com.kkunquizapp.QuizAppBackend.game.dto.GameRequestDTO;
import com.kkunquizapp.QuizAppBackend.game.dto.GameResponseDTO;
import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import com.kkunquizapp.QuizAppBackend.player.dto.PlayerRequestDTO;
import com.kkunquizapp.QuizAppBackend.player.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.AnswerRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {
    private final GameService gameService;
    private final QuestionService questionService;

    @PostMapping("/create")
    public ResponseEntity<GameResponseDTO> createGame(
            @RequestHeader("Authorization") String token,
            @RequestBody GameRequestDTO request) {
        GameResponseDTO game = gameService.startGameFromQuiz(request.getQuizId(), token);
        return ResponseEntity.ok(game);
    }

    @PostMapping("/{gameId}/start")
    public ResponseEntity<GameResponseDTO> startGame(
            @PathVariable UUID gameId,
            @RequestHeader("Authorization") String token) {
        GameResponseDTO game = gameService.startGame(gameId, token);
        return ResponseEntity.ok(game);
    }

    @PostMapping("/{gameId}/end")
    public ResponseEntity<GameResponseDTO> endGame(
            @PathVariable UUID gameId,
            @RequestHeader("Authorization") String token) {
        GameResponseDTO game = gameService.endGame(gameId, token, false);
        return ResponseEntity.ok(game);
    }

    @GetMapping("/{gameId}/players")
    public ResponseEntity<List<PlayerResponseDTO>> getGamePlayers(@PathVariable UUID gameId) {
        List<PlayerResponseDTO> players = gameService.getPlayersInGame(gameId);
        return ResponseEntity.ok(players);
    }

    @GetMapping("/{gameId}/details")
    public ResponseEntity<GameDetailsResponseDTO> getGameDetails(@PathVariable UUID gameId) {
        GameDetailsResponseDTO gameDetails = gameService.getGameDetails(gameId);
        return ResponseEntity.ok(gameDetails);
    }

    @GetMapping("/{gameId}/leaderboard")
    public ResponseEntity<List<PlayerResponseDTO>> getLeaderboard(@PathVariable UUID gameId) {
        List<PlayerResponseDTO> leaderboard = gameService.getLeaderboard(gameId);
        return ResponseEntity.ok(leaderboard);
    }

    @PostMapping("/join")
    public ResponseEntity<PlayerResponseDTO> joinGame(
            @RequestParam String pinCode,
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody PlayerRequestDTO request) {
        PlayerResponseDTO player = gameService.joinGame(pinCode, token, request);
        return ResponseEntity.ok(player);
    }

    @PostMapping("/{gameId}/answer")
    public ResponseEntity<?> submitAnswer(
            @PathVariable UUID gameId,
            @RequestBody AnswerRequestDTO answerRequest) {
        try {
            boolean isCorrect = gameService.processPlayerAnswer(gameId, answerRequest);
            return ResponseEntity.ok(new ApiResponseDTO(true, isCorrect ? "Câu trả lời đúng!" : "Câu trả lời sai!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponseDTO(false, e.getMessage()));
        }
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleException(RuntimeException e) {
        Map<String, String> response = new HashMap<>();
        response.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}