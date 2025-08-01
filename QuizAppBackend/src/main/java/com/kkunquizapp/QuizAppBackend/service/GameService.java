package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.*;
import com.kkunquizapp.QuizAppBackend.model.enums.GameStatus;

import java.util.List;
import java.util.UUID;

public interface GameService {
    GameResponseDTO startGameFromQuiz(UUID quizId, String token);
    PlayerResponseDTO joinGame(String pinCode, String token, PlayerRequestDTO request);
    GameResponseDTO startGame(UUID gameId, String token);
    GameResponseDTO endGame(UUID gameId, String token, boolean isAutoEnd);
    GameDetailsResponseDTO getGameDetails(UUID gameId);
    void playerExitBeforeStart(UUID gameId, UUID playerId);
    void playerExit(UUID gameId, UUID playerId);
    GameStatus getGameStatus(UUID gameId);
    List<PlayerResponseDTO> getPlayersInGame(UUID gameId);
    List<PlayerResponseDTO> getLeaderboard(UUID gameId); // New method for leaderboard
    boolean processPlayerAnswer(UUID gameId, AnswerRequestDTO answerRequest);
}