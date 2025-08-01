package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Game;
import com.kkunquizapp.QuizAppBackend.model.Leaderboard;
import com.kkunquizapp.QuizAppBackend.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaderboardRepo extends JpaRepository<Leaderboard, UUID> {
    Optional<Leaderboard> findByGameAndPlayer(Game game, Player player);
}
