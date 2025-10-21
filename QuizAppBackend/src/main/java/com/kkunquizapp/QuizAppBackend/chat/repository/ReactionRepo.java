package com.kkunquizapp.QuizAppBackend.chat.repository;

import com.kkunquizapp.QuizAppBackend.post.model.Reaction;
import com.kkunquizapp.QuizAppBackend.post.model.enums.ReactionTargetType;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReactionRepo extends JpaRepository<Reaction, Long> {
    boolean existsByUserAndTargetIdAndTargetType(User user, UUID targetId, ReactionTargetType targetType);
    Optional<Reaction> findByUserAndTargetIdAndTargetType(User user, UUID targetId, ReactionTargetType targetType);
}