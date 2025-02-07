package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Game;
import com.kkunquizapp.QuizAppBackend.model.enums.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameRepo extends JpaRepository<Game, UUID> {
    Optional<Game> findByPinCode(String pinCode);
    // Kiểm tra xem PIN code đã tồn tại chưa
    boolean existsByPinCode(String pinCode);
    boolean existsByHost_UserIdAndStatusNot(UUID hostId, GameStatus status);
}