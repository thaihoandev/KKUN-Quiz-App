package com.kkunquizapp.QuizAppBackend.repo;


import com.kkunquizapp.QuizAppBackend.model.ChatAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatAttachmentRepo extends JpaRepository<ChatAttachment, UUID> {
    List<ChatAttachment> findByMessage_IdOrderByDisplayOrderAscIdAsc(UUID messageId);
}