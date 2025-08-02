package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.NotificationDTO;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    void createNotification(UUID userId, UUID actorId, String verb, String targetType, UUID targetId);
    List<NotificationDTO> getNotifications(UUID userId);
}
