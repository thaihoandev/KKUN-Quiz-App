package com.kkunquizapp.QuizAppBackend.service.impl;


import com.kkunquizapp.QuizAppBackend.dto.ConversationDTO;
import com.kkunquizapp.QuizAppBackend.dto.MessageDTO;
import com.kkunquizapp.QuizAppBackend.mapper.ChatMapper;
import com.kkunquizapp.QuizAppBackend.repo.*;
import com.kkunquizapp.QuizAppBackend.service.ConversationService;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.model.enums.ConversationType;
import com.kkunquizapp.QuizAppBackend.model.enums.ParticipantRole;
import com.kkunquizapp.QuizAppBackend.utils.DirectKeyUtil;
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
    private final com.kkunquizapp.QuizAppBackend.repo.UserRepo userRepo;

    public ConversationServiceImpl(ConversationRepo convRepo,
                                   ConversationParticipantRepo partRepo,
                                   MessageRepo msgRepo,
                                   MessageStatusRepo statusRepo,
                                   com.kkunquizapp.QuizAppBackend.repo.UserRepo userRepo) {
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
        var partDTOs = partRepo.findByConversation_Id(c.getId()).stream()
                .map(ChatMapper::toParticipantDTO)
                .toList();

        var last = msgRepo.findFirstByConversation_IdOrderByCreatedAtDesc(c.getId()).orElse(null);
        MessageDTO lastDTO = null;
        if (last != null) {
            List<ChatReaction> reactions = List.of();
            lastDTO = ChatMapper.toMessageDTO(last, me, reactions);
        }

        long unread = statusRepo.countByUser_UserIdAndReadAtIsNullAndMessage_Conversation_Id(me, c.getId());
        return ChatMapper.toConversationDTO(c, partDTOs, lastDTO, unread);
    }
}
