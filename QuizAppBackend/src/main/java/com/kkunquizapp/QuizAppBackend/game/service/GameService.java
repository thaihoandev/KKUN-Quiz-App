package com.kkunquizapp.QuizAppBackend.game.service;

import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.model.enums.GameStatus;
import com.kkunquizapp.QuizAppBackend.player.dto.PlayerRequestDTO;
import com.kkunquizapp.QuizAppBackend.player.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.AnswerRequestDTO;

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