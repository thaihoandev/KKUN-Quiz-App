package com.kkunquizapp.QuizAppBackend.player.repository;

import com.kkunquizapp.QuizAppBackend.player.model.Player;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlayerRepo extends JpaRepository<Player, UUID> {
    List<Player> findByGame_GameId(UUID gameId);

    @Query("SELECT p FROM Player p WHERE p.game.id = :gameId AND (p.userId = :userId OR p.playerId = :playerSession)")
    Optional<Player> findByGameAndUserIdOrPlayerSession(@Param("gameId") UUID gameId, @Param("userId") UUID userId, @Param("playerSession") UUID playerSession);
}
