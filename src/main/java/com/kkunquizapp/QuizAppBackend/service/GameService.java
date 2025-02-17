package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.GameResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;
import com.kkunquizapp.QuizAppBackend.model.enums.GameStatus;

import java.util.List;
import java.util.UUID;

public interface GameService {
    GameResponseDTO startGameFromQuiz(UUID quizId, String token);
    GameResponseDTO startGame(UUID gameId, String token);
    GameResponseDTO endGame(UUID gameId, String token);
    List<PlayerResponseDTO> getPlayersInGame(UUID gameId);
    PlayerResponseDTO joinGame(String pinCode, String token, PlayerRequestDTO request);
    GameStatus getGameStatus(UUID gameId);
    void playerExitBeforeStart(UUID gameId, UUID playerId);
    void playerExit(UUID gameId, UUID playerId);
}