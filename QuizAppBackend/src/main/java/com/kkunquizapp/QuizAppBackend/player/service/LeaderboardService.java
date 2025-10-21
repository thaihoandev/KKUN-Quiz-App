package com.kkunquizapp.QuizAppBackend.player.service;

import com.kkunquizapp.QuizAppBackend.player.dto.LeaderboardResponseDTO;
import com.kkunquizapp.QuizAppBackend.game.model.Game;

import java.util.List;
import java.util.UUID;

public interface LeaderboardService {
    public void sendLeaderboard(Game game);
    List<LeaderboardResponseDTO> updateAndGetLeaderboard(Game game);
    void updatePlayerScore(UUID gameId, UUID playerId, int scoreToAdd);
}
