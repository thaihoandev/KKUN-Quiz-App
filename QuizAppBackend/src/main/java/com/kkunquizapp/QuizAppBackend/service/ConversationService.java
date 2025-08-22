package com.kkunquizapp.QuizAppBackend.service;


import com.kkunquizapp.QuizAppBackend.dto.ConversationDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ConversationService {
    ConversationDTO getOrCreateDirect(UUID userA, UUID userB);
    ConversationDTO createGroup(String title, List<UUID> memberIds, UUID creatorId);
    Page<ConversationDTO> listMyConversations(UUID myUserId, Pageable pageable);
}
