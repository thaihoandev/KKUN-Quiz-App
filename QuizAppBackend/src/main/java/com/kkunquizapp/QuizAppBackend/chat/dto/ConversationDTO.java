package com.kkunquizapp.QuizAppBackend.chat.dto;

import com.kkunquizapp.QuizAppBackend.common.dto.MessageDTO;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ConversationDTO {
    private UUID id;
    private String type;          // DIRECT | GROUP
    private String title;
    private LocalDateTime createdAt;
    private List<ParticipantDTO> participants;
    private MessageDTO lastMessage;
    private long unreadCount;
}