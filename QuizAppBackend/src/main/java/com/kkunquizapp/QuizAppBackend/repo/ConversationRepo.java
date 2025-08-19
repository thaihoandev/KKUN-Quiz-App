package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Conversation;
import com.kkunquizapp.QuizAppBackend.model.enums.ConversationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConversationRepo extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByTypeAndDirectKey(ConversationType type, String directKey);
    Page<Conversation> findDistinctByParticipants_User_UserId(UUID userId, Pageable pageable);
}
