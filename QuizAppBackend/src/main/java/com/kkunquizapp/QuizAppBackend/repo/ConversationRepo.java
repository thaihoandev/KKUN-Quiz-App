package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Conversation;
import com.kkunquizapp.QuizAppBackend.model.enums.ConversationType;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepo extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByTypeAndDirectKey(ConversationType type, String directKey);
    Page<Conversation> findDistinctByParticipants_User_UserId(UUID userId, Pageable pageable);

    @Modifying
    @Query("update Conversation c set c.lastMessageAt = :ts where c.id = :cid")
    void updateLastMessageAt(@Param("cid") UUID conversationId, @Param("ts") LocalDateTime ts);

    // tìm theo user, sort last_message_at desc (fallback created_at)
    @Query("""
        select distinct c from Conversation c
        join c.participants p
        where p.user.userId = :uid
        order by coalesce(c.lastMessageAt, c.createdAt) desc
        """)
    Page<Conversation> findMyConversationsOrderByLastMessage(@Param("uid") UUID uid, Pageable pageable);
}
