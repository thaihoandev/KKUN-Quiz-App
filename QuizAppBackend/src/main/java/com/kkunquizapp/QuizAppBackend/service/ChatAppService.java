package com.kkunquizapp.QuizAppBackend.service;

import java.util.List;
import java.util.UUID;

public interface ChatAppService {
    void sendMessageAsync(UUID senderId,
                          UUID conversationId,
                          String content,
                          List<UUID> mediaIds,
                          UUID replyToId,
                          String clientId);
}
