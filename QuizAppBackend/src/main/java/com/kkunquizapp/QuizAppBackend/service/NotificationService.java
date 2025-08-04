package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.NotificationDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    void createNotification(UUID userId, UUID actorId, String verb, String targetType, UUID targetId);
    Page<NotificationDTO> getNotifications(UUID userId, Pageable pageable);

}
