package com.kkunquizapp.QuizAppBackend.chat.event;

import com.kkunquizapp.QuizAppBackend.common.dto.MessageDTO;

import java.util.List;
import java.util.UUID;

/**
 * Published after a message is saved and statuses are created.
 * The listener will broadcast AFTER the surrounding transaction commits.
 */
public record MessageCreatedEvent(
        UUID conversationId,
        MessageDTO dto,
        List<UUID> participantIds
) {}
