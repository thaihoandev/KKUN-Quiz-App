package com.kkunquizapp.QuizAppBackend.common.eventbus.consumer;

import com.kkunquizapp.QuizAppBackend.chat.mapper.ChatMapper;
import com.kkunquizapp.QuizAppBackend.chat.model.*;
import com.kkunquizapp.QuizAppBackend.chat.repository.ConversationParticipantRepo;
import com.kkunquizapp.QuizAppBackend.chat.repository.MessageRepo;
import com.kkunquizapp.QuizAppBackend.chat.repository.MessageStatusRepo;
import com.kkunquizapp.QuizAppBackend.common.config.KafkaProducers;
import com.kkunquizapp.QuizAppBackend.common.dto.ChatMessageCommand;
import com.kkunquizapp.QuizAppBackend.common.dto.MessageCreatedEventPayload;
import com.kkunquizapp.QuizAppBackend.common.dto.MessageDTO;
import com.kkunquizapp.QuizAppBackend.fileUpload.repository.MediaRepo;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageCommandConsumer {

    private final MessageRepo msgRepo;
    private final ConversationParticipantRepo partRepo;
    private final MessageStatusRepo statusRepo;
    private final UserRepo userRepo;
    private final MediaRepo mediaRepo;
    private final KafkaProducers producers;

    @KafkaListener(topics = "${app.kafka.topics.chat-send}", groupId = "chat-writer")
    @Transactional
    public void handle(ChatMessageCommand cmd) {
        // 1) Validate đầy đủ
        if (!partRepo.existsByConversation_IdAndUser_UserId(cmd.conversationId(), cmd.senderId())) {
            throw new IllegalArgumentException("Sender not in conversation");
        }

        // 2) Idempotency theo clientId (DB cột client_id là unique)
        if (cmd.clientId() != null && msgRepo.existsByClientId(cmd.clientId())) {
            return; // đã xử lý rồi
        }

        // 3) Build & save Message
        Message m = Message.builder()
                .conversation(Conversation.builder().id(cmd.conversationId()).build())
                .sender(userRepo.getReferenceById(cmd.senderId()))
                .content(cmd.content())
                .clientId(cmd.clientId())
                .build();

        if (cmd.replyToId() != null) {
            msgRepo.findById(cmd.replyToId()).ifPresent(m::setReplyTo);
        }

        if (cmd.mediaIds() != null && !cmd.mediaIds().isEmpty()) {
            int order = 0;
            Set<ChatAttachment> atts = new LinkedHashSet<>();
            for (UUID mid : cmd.mediaIds()) {
                atts.add(ChatAttachment.builder()
                        .message(m)
                        .media(mediaRepo.getReferenceById(mid))
                        .displayOrder(order++)
                        .build());
            }
            m.setAttachments(atts);
        }

        m = msgRepo.saveAndFlush(m);

        // 🔧 Quan trọng: tạo biến effectively final để dùng trong lambda
        final Message saved = m;

        // 4) MessageStatus cho từng participant
        List<ConversationParticipant> participants = partRepo.findByConversation_Id(cmd.conversationId());
        LocalDateTime now = LocalDateTime.now();

        List<MessageStatus> statuses = participants.stream()
                .map(p -> MessageStatus.builder()
                        .id(new MessageStatus.MessageStatusId(saved.getId(), p.getUser().getUserId()))
                        .message(saved)
                        .user(p.getUser())
                        .deliveredAt(Objects.equals(p.getUser().getUserId(), cmd.senderId()) ? now : null)
                        .readAt(null)
                        .build())
                .toList(); // nếu JDK < 16, đổi sang .collect(Collectors.toList())
        statusRepo.saveAll(statuses);

        // 5) Map DTO + publish "created"
        MessageDTO dto = ChatMapper.toMessageDTO(saved, cmd.senderId(), List.of());
        List<UUID> participantIds = participants.stream()
                .map(p -> p.getUser().getUserId())
                .collect(Collectors.toList());

        producers.publishCreated(new MessageCreatedEventPayload(cmd.conversationId(), dto, participantIds));
    }
}
