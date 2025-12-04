package com.kkunquizapp.QuizAppBackend.game.repository;

import com.kkunquizapp.QuizAppBackend.game.model.Game;
import com.kkunquizapp.QuizAppBackend.game.model.enums.GameStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameRepo extends JpaRepository<Game, UUID> {

    Optional<Game> findByPinCode(String pinCode);

    boolean existsByPinCode(String pinCode);

    // Tìm game + fetch host + quiz để tránh N+1
    @Query("SELECT g FROM Game g JOIN FETCH g.host JOIN FETCH g.quiz WHERE g.gameId = :gameId")
    Optional<Game> findByIdWithHostAndQuiz(@Param("gameId") UUID gameId);

    // Dùng cho Host xem danh sách game đã tạo
    Page<Game> findByHostUserIdOrderByCreatedAtDesc(UUID hostId, Pageable pageable);

    // Tìm game đang hoạt động theo PIN (dùng nhiều trong join)
    @Query("SELECT g FROM Game g WHERE g.pinCode = :pinCode AND g.gameStatus IN ('WAITING', 'IN_PROGRESS', 'PAUSED')")
    Optional<Game> findActiveByPinCode(@Param("pinCode") String pinCode);

    // Cleanup: tìm game quá cũ để xóa (optional)
    @Query("SELECT g FROM Game g WHERE g.gameStatus IN ('FINISHED', 'CANCELLED') AND g.endedAt < :cutoff")
    List<Game> findExpiredGamesForCleanup(@Param("cutoff") java.time.LocalDateTime cutoff);
}