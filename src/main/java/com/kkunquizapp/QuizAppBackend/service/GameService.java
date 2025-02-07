package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.GameResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;

import java.util.List;
import java.util.UUID;

public interface GameService {
    GameResponseDTO startGameFromQuiz(UUID quizId, String token);
    GameResponseDTO startGame(UUID gameId, String token);
    GameResponseDTO endGame(UUID gameId, String token);
    GameResponseDTO findByPinCode(String pinCode);
    List<PlayerResponseDTO> getPlayers(UUID gameId);
    PlayerResponseDTO joinGame(String pinCode, String token, PlayerRequestDTO request);
}