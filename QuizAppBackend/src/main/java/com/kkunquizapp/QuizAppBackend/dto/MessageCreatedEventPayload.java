package com.kkunquizapp.QuizAppBackend.dto;

import com.kkunquizapp.QuizAppBackend.dto.MessageDTO;
import java.util.List;
import java.util.UUID;

public record MessageCreatedEventPayload(
        UUID conversationId,
        MessageDTO message,
        List<UUID> participantIds
) {}
