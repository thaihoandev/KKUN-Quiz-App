package com.kkunquizapp.QuizAppBackend.chat.service.impl;


import com.kkunquizapp.QuizAppBackend.chat.dto.ConversationDTO;
import com.kkunquizapp.QuizAppBackend.common.dto.MessageDTO;
import com.kkunquizapp.QuizAppBackend.chat.dto.ParticipantDTO;
import com.kkunquizapp.QuizAppBackend.user.dto.UserBriefDTO;
import com.kkunquizapp.QuizAppBackend.chat.repository.*;
import com.kkunquizapp.QuizAppBackend.chat.service.ConversationService;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.chat.model.*;
import com.kkunquizapp.QuizAppBackend.chat.model.enums.ConversationType;
import com.kkunquizapp.QuizAppBackend.chat.model.enums.ParticipantRole;
import com.kkunquizapp.QuizAppBackend.common.utils.DirectKeyUtil;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepo convRepo;
    private final ConversationParticipantRepo partRepo;
    private final MessageRepo msgRepo;
    private final MessageStatusRepo statusRepo;
    private final UserRepo userRepo;

    public ConversationServiceImpl(ConversationRepo convRepo,
                                   ConversationParticipantRepo partRepo,
                                   MessageRepo msgRepo,
                                   MessageStatusRepo statusRepo,
                                   UserRepo userRepo) {
        this.convRepo = convRepo;
        this.partRepo = partRepo;
        this.msgRepo = msgRepo;
        this.statusRepo = statusRepo;
        this.userRepo = userRepo;
    }

    @Override
    public ConversationDTO getOrCreateDirect(UUID userA, UUID userB) {
        if (userA.equals(userB)) throw new IllegalArgumentException("Không hỗ trợ chat với chính mình");
        var key = DirectKeyUtil.of(userA, userB);
        var found = convRepo.findByTypeAndDirectKey(ConversationType.DIRECT, key).orElse(null);
        if (found == null) {
            try {
                var conv = Conversation.builder()
                        .type(ConversationType.DIRECT)
                        .directKey(key)
                        .build();

                var ua = userRepo.getReferenceById(userA);
                var ub = userRepo.getReferenceById(userB);

                var pa = ConversationParticipant.builder()
                        .id(new ConversationParticipant.ConversationParticipantId(null, userA))
                        .conversation(conv).user(ua).role(ParticipantRole.MEMBER).build();
                var pb = ConversationParticipant.builder()
                        .id(new ConversationParticipant.ConversationParticipantId(null, userB))
                        .conversation(conv).user(ub).role(ParticipantRole.MEMBER).build();

                conv.getParticipants().add(pa);
                conv.getParticipants().add(pb);

                found = convRepo.save(conv);
            } catch (DataIntegrityViolationException e) {
                found = convRepo.findByTypeAndDirectKey(ConversationType.DIRECT, key).orElseThrow(() -> e);
            }
        }
        return toConversationDTO(found, userA);
    }

    @Override
    public ConversationDTO createGroup(String title, List<UUID> memberIds, UUID creatorId) {
        var conv = Conversation.builder()
                .type(ConversationType.GROUP)
                .title(title)
                .createdBy(userRepo.getReferenceById(creatorId))
                .build();

        for (UUID uid : memberIds) {
            User u = userRepo.getReferenceById(uid);
            var p = ConversationParticipant.builder()
                    .id(new ConversationParticipant.ConversationParticipantId(null, uid))
                    .conversation(conv).user(u)
                    .role(uid.equals(creatorId) ? ParticipantRole.OWNER : ParticipantRole.MEMBER)
                    .build();
            conv.getParticipants().add(p);
        }
        conv = convRepo.save(conv);
        return toConversationDTO(conv, creatorId);
    }

    @Override
    public Page<ConversationDTO> listMyConversations(UUID myUserId, Pageable pageable) {
        // gợi ý mặc định sort theo last message desc (nếu client chưa truyền sort)
        Pageable effective = pageable;
        if (pageable.getSort().isUnsorted()) {
            // Chưa có cột lastMessage để sort trực tiếp, tạm để theo created_at desc
            effective = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        Page<Conversation> page = convRepo.findDistinctByParticipants_User_UserId(myUserId, effective);

        // map từng conversation → DTO (tính lastMessage + unreadCount)
        List<ConversationDTO> mapped = page.getContent().stream()
                .map(c -> toConversationDTO(c, myUserId))
                .collect(Collectors.toList());

        return new PageImpl<>(mapped, effective, page.getTotalElements());
    }

    // helpers
    private ConversationDTO toConversationDTO(Conversation c, UUID me) {
        // 1. Map participants -> ParticipantDTO
        var parts = partRepo.findByConversation_Id(c.getId()).stream()
                .map(p -> ParticipantDTO.builder()
                        .userId(p.getUser().getUserId())
                        .role(p.getRole() != null ? p.getRole().name() : "MEMBER")
                        .nickname(p.getNickname())
                        .joinedAt(p.getJoinedAt())
                        .user(UserBriefDTO.builder()
                                .userId(p.getUser().getUserId())
                                .name(p.getUser().getName())
                                .username(p.getUser().getUsername())
                                .avatar(p.getUser().getAvatar())
                                .build()
                        )
                        .build()
                ).toList();

        // 2. Map last message -> MessageDTO
        var last = msgRepo.findFirstByConversation_IdOrderByCreatedAtDesc(c.getId()).orElse(null);
        MessageDTO lastDTO = null;
        if (last != null) {
            // reactions đếm emoji (có thể từ bảng reactions riêng)
            Map<String, Integer> rx = new HashMap<>();
            // ví dụ: reactionRepo.findByMessage_Id(last.getId()) -> gộp count
            // rxList.forEach(r -> rx.merge(r.getEmoji(), 1, Integer::sum));

            lastDTO = MessageDTO.builder()
                    .id(last.getId())
                    .conversationId(c.getId())
                    .clientId(last.getClientId())
                    .sender(UserBriefDTO.builder()
                            .userId(last.getSender().getUserId())
                            .name(last.getSender().getName())
                            .username(last.getSender().getUsername())
                            .avatar(last.getSender().getAvatar())
                            .build())
                    .content(last.getContent())
                    .replyToId(last.getReplyTo() != null ? last.getReplyTo().getId() : null)
                    .createdAt(last.getCreatedAt())
                    .editedAt(last.getEditedAt())
                    .deleted(last.getDeletedAt() != null)
                    .attachments(List.of()) // TODO: map MediaBriefDTO nếu có
                    .reactions(rx)
                    .reactedByMe(false) // TODO: tính theo userId "me" nếu cần
                    .build();
        }

        // 3. Unread count
        long unread = statusRepo.countByUser_UserIdAndReadAtIsNullAndMessage_Conversation_Id(me, c.getId());

        // 4. Build ConversationDTO (giả sử bạn có class ConversationDTO như sau)
        return ConversationDTO.builder()
                .id(c.getId())
                .type(c.getType().name())
                .title(c.getTitle())
                .participants(parts)
                .lastMessage(lastDTO)
                .unreadCount(unread)
                .build();
    }

}
