package com.kkunquizapp.QuizAppBackend.common.dto;

import com.kkunquizapp.QuizAppBackend.common.dto.MessageDTO;
import java.util.List;
import java.util.UUID;

public record MessageCreatedEventPayload(
        UUID conversationId,
        MessageDTO message,
        List<UUID> participantIds
) {}
