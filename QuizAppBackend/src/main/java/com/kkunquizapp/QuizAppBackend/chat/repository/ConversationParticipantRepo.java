package com.kkunquizapp.QuizAppBackend.chat.repository;

import com.kkunquizapp.QuizAppBackend.chat.model.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationParticipantRepo extends JpaRepository<ConversationParticipant, ConversationParticipant.ConversationParticipantId> {
  List<ConversationParticipant> findByUser_UserId(UUID userId);
  List<ConversationParticipant> findByConversation_Id(UUID conversationId);
  boolean existsByConversation_IdAndUser_UserId(UUID conversationId, UUID userId);
}