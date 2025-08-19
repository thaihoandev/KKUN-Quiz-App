package com.kkunquizapp.QuizAppBackend.service.impl;

// chat/service/impl/MessageServiceImpl.java
import com.kkunquizapp.QuizAppBackend.dto.MessageDTO;
import com.kkunquizapp.QuizAppBackend.mapper.ChatMapper;
import com.kkunquizapp.QuizAppBackend.repo.*;
import com.kkunquizapp.QuizAppBackend.service.MessageService;
import com.kkunquizapp.QuizAppBackend.model.Media;
import com.kkunquizapp.QuizAppBackend.model.*;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageRepo msgRepo;
    private final ConversationParticipantRepo partRepo;
    private final ChatReactionRepo rxRepo;
    private final MessageStatusRepo statusRepo;
    private final ChatAttachmentRepo attRepo;
    private final com.kkunquizapp.QuizAppBackend.repo.UserRepo userRepo;
    private final com.kkunquizapp.QuizAppBackend.repo.MediaRepo mediaRepo;

    public MessageServiceImpl(MessageRepo msgRepo,
                              ConversationParticipantRepo partRepo,
                              ChatReactionRepo rxRepo,
                              MessageStatusRepo statusRepo,
                              ChatAttachmentRepo attRepo,
                              com.kkunquizapp.QuizAppBackend.repo.UserRepo userRepo,
                              com.kkunquizapp.QuizAppBackend.repo.MediaRepo mediaRepo) {
        this.msgRepo = msgRepo;
        this.partRepo = partRepo;
        this.rxRepo = rxRepo;
        this.statusRepo = statusRepo;
        this.attRepo = attRepo;
        this.userRepo = userRepo;
        this.mediaRepo = mediaRepo;
    }

    @Override
    public MessageDTO sendMessage(UUID senderId, UUID conversationId, String content,
                                  List<UUID> mediaIds, UUID replyToId, String clientId) {
        if (!partRepo.existsByConversation_IdAndUser_UserId(conversationId, senderId)) {
            throw new IllegalArgumentException("Sender is not a participant of the conversation");
        }

        var m = Message.builder()
                .conversation(Conversation.builder().id(conversationId).build())
                .sender(userRepo.getReferenceById(senderId))
                .content(content)
                .clientId(clientId)
                .build();

        if (replyToId != null) {
            m.setReplyTo(msgRepo.findById(replyToId).orElse(null));
        }

        if (mediaIds != null && !mediaIds.isEmpty()) {
            int ord = 0;
            var atts = new LinkedHashSet<ChatAttachment>();
            for (UUID mid : mediaIds) {
                Media media = mediaRepo.getReferenceById(mid);
                var ca = ChatAttachment.builder()
                        .message(m)
                        .media(media)
                        .displayOrder(ord++)
                        .build();
                atts.add(ca);
            }
            m.setAttachments(atts);
        }

        m = msgRepo.save(m);

        // tạo status cho mọi participant
        var participants = partRepo.findByConversation_Id(conversationId);
        LocalDateTime now = LocalDateTime.now();
        for (var p : participants) {
            var id = new MessageStatus.MessageStatusId(m.getId(), p.getUser().getUserId());
            var ms = MessageStatus.builder()
                    .id(id)
                    .message(m)
                    .user(p.getUser())
                    .deliveredAt(p.getUser().getUserId().equals(senderId) ? now : null)
                    .readAt(null)
                    .build();
            statusRepo.save(ms);
        }

        List<ChatReaction> reactions = Collections.emptyList();
        return ChatMapper.toMessageDTO(m, senderId, reactions);
    }

    @Override
    public Page<MessageDTO> getMessages(UUID conversationId, UUID beforeMessageId, Pageable pageable, UUID me) {
        // ép sort createdAt DESC cho ngược thời gian (chat view)
        Pageable effective = pageable;
        if (pageable.getSort().isUnsorted()) {
            effective = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        Page<Message> page;
        long total;
        if (beforeMessageId != null) {
            var anchor = msgRepo.findById(beforeMessageId).orElseThrow();
            page = msgRepo.findByConversation_IdAndCreatedAtBeforeOrderByCreatedAtDesc(
                    conversationId, anchor.getCreatedAt(), effective);
            total = msgRepo.countByConversation_IdAndCreatedAtBefore(conversationId, anchor.getCreatedAt());
        } else {
            page = msgRepo.findByConversation_IdOrderByCreatedAtDesc(conversationId, effective);
            total = msgRepo.countByConversation_Id(conversationId);
        }

        // load reactions theo từng message (đơn giản – có thể tối ưu bằng batch)
        Map<UUID, List<ChatReaction>> rxByMsg = page.getContent().stream()
                .collect(Collectors.toMap(Message::getId, m -> rxRepo.findByMessage_Id(m.getId())));

        List<MessageDTO> mapped = page.getContent().stream()
                .map(m -> ChatMapper.toMessageDTO(m, me, rxByMsg.getOrDefault(m.getId(), List.of())))
                .collect(Collectors.toList());

        return new PageImpl<>(mapped, effective, total);
    }

    @Override
    public void markReadUpTo(UUID conversationId, UUID readerId, UUID lastMessageId) {
        var last = msgRepo.findById(lastMessageId).orElseThrow();
        if (!last.getConversation().getId().equals(conversationId))
            throw new IllegalArgumentException("Message does not belong to conversation");
        var now = LocalDateTime.now();
        statusRepo.markReadUpTo(readerId, conversationId, last.getCreatedAt(), now);
    }

    @Override public void addReaction(UUID messageId, UUID userId, String emoji) {
        var id = new ChatReaction.ReactionId(messageId, userId, emoji);
        if (rxRepo.existsById(id)) return;
        var rx = ChatReaction.builder()
                .id(id)
                .message(Message.builder().id(messageId).build())
                .user(userRepo.getReferenceById(userId))
                .build();
        rxRepo.save(rx);
    }

    @Override public void removeReaction(UUID messageId, UUID userId, String emoji) {
        rxRepo.deleteById(new ChatReaction.ReactionId(messageId, userId, emoji));
    }
}
