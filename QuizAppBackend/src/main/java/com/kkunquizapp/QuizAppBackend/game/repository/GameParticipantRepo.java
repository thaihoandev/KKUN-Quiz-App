package com.kkunquizapp.QuizAppBackend.game.repository;

import com.kkunquizapp.QuizAppBackend.game.model.Game;
import com.kkunquizapp.QuizAppBackend.game.model.GameParticipant;
import com.kkunquizapp.QuizAppBackend.game.model.enums.ParticipantStatus;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameParticipantRepo extends JpaRepository<GameParticipant, UUID> {

    Optional<GameParticipant> findByGameAndUser(Game game, User user);  // THÊM DÒNG NÀY

    Optional<GameParticipant> findByGameAndUser_UserId(Game game, UUID userId);

    List<GameParticipant> findByGame(Game game);

    List<GameParticipant> findByGameAndStatusIn(Game game, List<ParticipantStatus> statuses);

    @Query("""
        SELECT p FROM GameParticipant p
        WHERE p.game = :game
        ORDER BY p.score DESC, p.totalTimeMs ASC, p.joinedAt ASC
        """)
    List<GameParticipant> findByGameOrderByScoreDescTotalTimeMsAsc(@Param("game") Game game);

    long countByGameAndStatusIn(Game game, List<ParticipantStatus> statuses);

    Optional<GameParticipant> findByGuestToken(String guestToken);
}