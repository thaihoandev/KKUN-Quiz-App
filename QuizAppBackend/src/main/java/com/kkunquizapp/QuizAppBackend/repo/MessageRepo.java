package com.kkunquizapp.QuizAppBackend.repo;


import com.kkunquizapp.QuizAppBackend.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepo extends JpaRepository<Message, UUID> {
    Optional<Message> findFirstByConversation_IdOrderByCreatedAtDesc(UUID conversationId);
    Page<Message> findByConversation_IdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    Page<Message> findByConversation_IdAndCreatedAtBeforeOrderByCreatedAtDesc(
            UUID conversationId, LocalDateTime before, Pageable pageable);

    long countByConversation_Id(UUID conversationId);

    long countByConversation_IdAndCreatedAtBefore(UUID conversationId, LocalDateTime before);
}