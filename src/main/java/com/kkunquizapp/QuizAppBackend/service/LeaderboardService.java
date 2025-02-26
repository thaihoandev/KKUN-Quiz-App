package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.LeaderboardResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;

import java.util.List;
import java.util.UUID;

public interface LeaderboardService {
    public void sendLeaderboard(Game game);
    List<LeaderboardResponseDTO> updateAndGetLeaderboard(Game game);
    void updatePlayerScore(UUID gameId, UUID playerId, int scoreToAdd);
}
