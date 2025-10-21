package com.kkunquizapp.QuizAppBackend.chat.repository;

// chat/repo/MessageStatusRepository.java

import com.kkunquizapp.QuizAppBackend.chat.model.MessageStatus;
import com.kkunquizapp.QuizAppBackend.chat.model.MessageStatus.MessageStatusId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.UUID;

public interface MessageStatusRepo extends JpaRepository<MessageStatus, MessageStatusId> {
    long countByUser_UserIdAndReadAtIsNullAndMessage_Conversation_Id(UUID userId, UUID conversationId);

    @Modifying
    @Query("""
    update MessageStatus ms
       set ms.readAt = :now
     where ms.user.userId = :userId
       and ms.message.conversation.id = :conversationId
       and ms.readAt is null
       and ms.message.createdAt <= :cutoff
    """)
    int markReadUpTo(UUID userId, UUID conversationId, LocalDateTime cutoff, LocalDateTime now);
}
