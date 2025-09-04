package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.config.KafkaProducers;
import com.kkunquizapp.QuizAppBackend.dto.ChatMessageCommand;
import com.kkunquizapp.QuizAppBackend.repo.ConversationParticipantRepo;
import com.kkunquizapp.QuizAppBackend.service.ChatAppService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatAppServiceImpl implements ChatAppService {

    private final KafkaProducers producers;
    private final ConversationParticipantRepo partRepo;

    @Override
    public void sendMessageAsync(UUID senderId, UUID conversationId, String content,
                                 List<UUID> mediaIds, UUID replyToId, String clientId) {
        // Validate nhẹ: đảm bảo người gửi thuộc conversation
        if (!partRepo.existsByConversation_IdAndUser_UserId(conversationId, senderId)) {
            throw new IllegalArgumentException("Sender is not a participant of the conversation");
        }

        producers.publishSend(new ChatMessageCommand(
                clientId, senderId, conversationId, content, mediaIds, replyToId, LocalDateTime.now()
        ));
    }
}
