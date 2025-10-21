package com.kkunquizapp.QuizAppBackend.notification.service;

import com.kkunquizapp.QuizAppBackend.notification.dto.NotificationDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {
    void createNotification(UUID userId, UUID actorId, String verb, String targetType, UUID targetId, String content);
    Page<NotificationDTO> getNotifications(UUID userId, Pageable pageable);

}
