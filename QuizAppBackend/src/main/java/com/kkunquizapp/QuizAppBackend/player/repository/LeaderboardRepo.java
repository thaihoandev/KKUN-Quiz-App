package com.kkunquizapp.QuizAppBackend.player.repository;

import com.kkunquizapp.QuizAppBackend.game.model.Game;
import com.kkunquizapp.QuizAppBackend.player.model.Leaderboard;
import com.kkunquizapp.QuizAppBackend.player.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaderboardRepo extends JpaRepository<Leaderboard, UUID> {
    Optional<Leaderboard> findByGameAndPlayer(Game game, Player player);
}
