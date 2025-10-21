package com.kkunquizapp.QuizAppBackend.notification.dto;

import com.kkunquizapp.QuizAppBackend.user.dto.UserDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class NotificationDTO {
    private UUID notificationId;
    private UserDTO user;
    private UserDTO actor;
    private String verb;
    private String targetType;
    private UUID targetId;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String content;
}