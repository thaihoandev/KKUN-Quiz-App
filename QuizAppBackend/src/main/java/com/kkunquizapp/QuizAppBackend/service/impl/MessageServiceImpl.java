package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.MessageDTO;
import com.kkunquizapp.QuizAppBackend.event.MessageCreatedEvent;
import com.kkunquizapp.QuizAppBackend.mapper.ChatMapper;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.repo.*;
import com.kkunquizapp.QuizAppBackend.service.MessageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepo msgRepo;
    private final ConversationParticipantRepo partRepo;
    private final ChatReactionRepo rxRepo;
    private final MessageStatusRepo statusRepo;
    private final ChatAttachmentRepo attRepo;
    private final UserRepo userRepo;
    private final MediaRepo mediaRepo;
    private final ApplicationEventPublisher publisher;

    @Override
    public MessageDTO sendMessage(UUID senderId,
                                  UUID conversationId,
                                  String content,
                                  List<UUID> mediaIds,
                                  UUID replyToId,
                                  String clientId) {

        // 1) Validate participant
        validateSender(senderId, conversationId);

        // 2) Build message
        Message message = Message.builder()
                .conversation(Conversation.builder().id(conversationId).build())
                .sender(userRepo.getReferenceById(senderId))
                .content(content)
                .clientId(clientId)
                .build();

        // Reply-to
        if (replyToId != null) {
            msgRepo.findById(replyToId).ifPresent(message::setReplyTo);
        }

        // 3) Attach media
        if (mediaIds != null && !mediaIds.isEmpty()) {
            int order = 0;
            Set<ChatAttachment> attachments = new LinkedHashSet<>();
            for (UUID mid : mediaIds) {
                Media media = mediaRepo.getReferenceById(mid);
                attachments.add(ChatAttachment.builder()
                        .message(message)
                        .media(media)
                        .displayOrder(order++)
                        .build());
            }
            message.setAttachments(attachments);
        }

        // 4) Save (flush to get ID/createdAt immediately)
        message = msgRepo.saveAndFlush(message);

        // 5) Create MessageStatus
        List<ConversationParticipant> participants = partRepo.findByConversation_Id(conversationId);
        LocalDateTime now = LocalDateTime.now();

        final Message saved = message; // effectively final for lambda
        List<MessageStatus> statuses = participants.stream()
                .map(p -> MessageStatus.builder()
                        .id(new MessageStatus.MessageStatusId(saved.getId(), p.getUser().getUserId()))
                        .message(saved)
                        .user(p.getUser())
                        .deliveredAt(Objects.equals(p.getUser().getUserId(), senderId) ? now : null)
                        .readAt(null)
                        .build())
                .toList();
        statusRepo.saveAll(statuses);

        // 6) Map to DTO (no reactions yet)
        MessageDTO dto = ChatMapper.toMessageDTO(saved, senderId, List.of());

        // 7) Publish event; listener will broadcast AFTER COMMIT
        List<UUID> participantIds = participants.stream()
                .map(p -> p.getUser().getUserId())
                .toList();
        publisher.publishEvent(new MessageCreatedEvent(conversationId, dto, participantIds));

        return dto;
    }

    @Override
    public Page<MessageDTO> getMessages(UUID conversationId, UUID beforeMessageId, Pageable pageable, UUID me) {
        Pageable effective = pageable.getSort().isUnsorted()
                ? PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"))
                : pageable;

        Page<Message> page;
        long total;

        if (beforeMessageId != null) {
            Message anchor = msgRepo.findById(beforeMessageId).orElseThrow();
            page = msgRepo.findByConversation_IdAndCreatedAtBeforeOrderByCreatedAtDesc(
                    conversationId, anchor.getCreatedAt(), effective);
            total = msgRepo.countByConversation_IdAndCreatedAtBefore(conversationId, anchor.getCreatedAt());
        } else {
            page = msgRepo.findByConversation_IdOrderByCreatedAtDesc(conversationId, effective);
            total = msgRepo.countByConversation_Id(conversationId);
        }

        // Load reactions per message (keep simple; can optimize later)
        Map<UUID, List<ChatReaction>> rxByMsg = page.getContent().stream()
                .collect(Collectors.toMap(
                        Message::getId,
                        m -> rxRepo.findByMessage_Id(m.getId())
                ));

        List<MessageDTO> mapped = page.getContent().stream()
                .map(m -> ChatMapper.toMessageDTO(m, me, rxByMsg.getOrDefault(m.getId(), List.of())))
                .toList();

        return new PageImpl<>(mapped, effective, total);
    }

    @Override
    public void markReadUpTo(UUID conversationId, UUID readerId, UUID lastMessageId) {
        Message last = msgRepo.findById(lastMessageId).orElseThrow();
        if (!last.getConversation().getId().equals(conversationId)) {
            throw new IllegalArgumentException("Message does not belong to conversation");
        }
        statusRepo.markReadUpTo(readerId, conversationId, last.getCreatedAt(), LocalDateTime.now());
    }

    @Override
    public void addReaction(UUID messageId, UUID userId, String emoji) {
        var id = new ChatReaction.ReactionId(messageId, userId, emoji);
        if (rxRepo.existsById(id)) return;

        ChatReaction rx = ChatReaction.builder()
                .id(id)
                .message(Message.builder().id(messageId).build())
                .user(userRepo.getReferenceById(userId))
                .build();

        rxRepo.save(rx);
    }

    @Override
    public void removeReaction(UUID messageId, UUID userId, String emoji) {
        rxRepo.deleteById(new ChatReaction.ReactionId(messageId, userId, emoji));
    }

    // --- helpers ---
    private void validateSender(UUID senderId, UUID conversationId) {
        if (!partRepo.existsByConversation_IdAndUser_UserId(conversationId, senderId)) {
            throw new IllegalArgumentException("Sender is not a participant of the conversation");
        }
    }
}
