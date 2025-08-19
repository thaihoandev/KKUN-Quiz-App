package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.MessageDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface MessageService {
    MessageDTO sendMessage(UUID senderId, UUID conversationId, String content,
                           List<UUID> mediaIds, UUID replyToId, String clientId);

    // dùng Pageable; hỗ trợ anchor 'beforeMessageId'
    Page<MessageDTO> getMessages(UUID conversationId, UUID beforeMessageId, Pageable pageable, UUID me);

    void markReadUpTo(UUID conversationId, UUID readerId, UUID lastMessageId);
    void addReaction(UUID messageId, UUID userId, String emoji);
    void removeReaction(UUID messageId, UUID userId, String emoji);
}