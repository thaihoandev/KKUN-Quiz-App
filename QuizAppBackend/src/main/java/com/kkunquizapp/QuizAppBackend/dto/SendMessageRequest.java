package com.kkunquizapp.QuizAppBackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    private UUID conversationId;
    private String content;
    private List<UUID> mediaIds; // optional
    private UUID replyToId;      // optional
    private String clientId;     // optional
}
