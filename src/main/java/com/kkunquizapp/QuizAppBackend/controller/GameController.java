package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.GameRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.GameResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;
import com.kkunquizapp.QuizAppBackend.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@RestController
@RequestMapping("/games")
@RequiredArgsConstructor
public class GameController {
    private final GameService gameService;

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
        GameResponseDTO game = gameService.endGame(gameId, token);
        return ResponseEntity.ok(game);
    }


    @GetMapping("/{gameId}/players")
    public ResponseEntity<List<PlayerResponseDTO>> getGamePlayers(@PathVariable UUID gameId) {
        List<PlayerResponseDTO> players = gameService.getPlayersInGame(gameId);
        return ResponseEntity.ok(players);
    }

    @PostMapping("/join")
    public ResponseEntity<PlayerResponseDTO> joinGame(
            @RequestParam String pinCode,
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody PlayerRequestDTO request) {
        PlayerResponseDTO player = gameService.joinGame(pinCode, token, request);
        return ResponseEntity.ok(player);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleException(RuntimeException e) {
        Map<String, String> response = new HashMap<>();
        response.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}
