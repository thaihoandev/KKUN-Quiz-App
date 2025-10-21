package com.kkunquizapp.QuizAppBackend.chat.repository;

// chat/repo/ReactionRepository.java

import com.kkunquizapp.QuizAppBackend.chat.model.ChatReaction;
import com.kkunquizapp.QuizAppBackend.chat.model.ChatReaction.ReactionId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatReactionRepo extends JpaRepository<ChatReaction, ReactionId> {
    List<ChatReaction> findByMessage_Id(UUID messageId);
    void deleteById(ReactionId id);
    boolean existsById(ReactionId id);
}
