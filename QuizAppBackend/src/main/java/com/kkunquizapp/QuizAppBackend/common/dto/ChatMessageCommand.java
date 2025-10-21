package com.kkunquizapp.QuizAppBackend.common.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ChatMessageCommand(
        String clientId,           // bạn đang lưu clientId là String trong DB → để String cho khớp
        UUID senderId,
        UUID conversationId,
        String content,
        List<UUID> mediaIds,
        UUID replyToId,
        LocalDateTime ts
) {}
