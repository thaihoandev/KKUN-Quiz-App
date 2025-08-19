package com.kkunquizapp.QuizAppBackend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageDTO {
    private UUID id;
    private UUID conversationId;
    private String clientId;
    private UserBriefDTO sender;
    private String content;
    private UUID replyToId;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
    private Boolean deleted;              // derived from deletedAt != null
    private List<MediaBriefDTO> attachments;
    private Map<String, Integer> reactions; // emoji -> count
    private Boolean reactedByMe;            // tiện cho UI
}