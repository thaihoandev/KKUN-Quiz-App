package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Reaction;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReactionRepo extends JpaRepository<Reaction, Long> {
    boolean existsByUserAndTargetIdAndTargetType(User user, UUID targetId, ReactionTargetType targetType);
}