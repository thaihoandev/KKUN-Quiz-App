package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.NotificationDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserDTO;
import com.kkunquizapp.QuizAppBackend.model.Notification;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.repo.NotificationRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.NotificationService;
import com.kkunquizapp.QuizAppBackend.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationImpl implements NotificationService {
    @Autowired
    private NotificationRepo notificationRepository;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public void createNotification(UUID userId, UUID actorId, String verb, String targetType, UUID targetId, String content) {
        if (userId.equals(actorId)) {
            log.info("Skipping self-notification for userId: {}", userId);
            return; // No self-notification
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", userId);
                    return new RuntimeException("User not found");
                });
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> {
                    log.error("Actor not found with ID: {}", actorId);
                    return new RuntimeException("Actor not found");
                });

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setActor(actor);
        notification.setVerb(verb);
        notification.setTargetType(targetType);
        notification.setTargetId(targetId);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setContent(StringUtils.abbreviate(content,20)); // Save comment content
        notificationRepository.save(notification);

        log.info("Created notification for userId: {}, verb: {}, targetType: {}, targetId: {}, content: {}",
                userId, verb, targetType, targetId, content);

        // Send real-time notification
        NotificationDTO notificationDTO = mapToNotificationDTO(notification);
        messagingTemplate.convertAndSend("/topic/notifications/user/" + userId, notificationDTO);
    }

    @Override
    public Page<NotificationDTO> getNotifications(UUID userId, Pageable pageable) {
        log.info("Fetching notifications for userId: {}", userId);
        Page<Notification> page = notificationRepository.findByUserUserId(userId, pageable);
        return page.map(this::mapToNotificationDTO);
    }

    private NotificationDTO mapToNotificationDTO(Notification notification) {
        NotificationDTO notificationDTO = new NotificationDTO();
        notificationDTO.setNotificationId(notification.getNotificationId());
        notificationDTO.setUser(mapToUserDTO(notification.getUser()));
        notificationDTO.setActor(notification.getActor() != null ? mapToUserDTO(notification.getActor()) : null);
        notificationDTO.setVerb(notification.getVerb());
        notificationDTO.setTargetType(notification.getTargetType());
        notificationDTO.setTargetId(notification.getTargetId());
        notificationDTO.setRead(notification.isRead());
        notificationDTO.setCreatedAt(notification.getCreatedAt());
        notificationDTO.setContent(notification.getContent()); // Include content
        log.debug("Mapped notification to DTO: {}", notificationDTO);
        return notificationDTO;
    }

    private UserDTO mapToUserDTO(User user) {
        return UserDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .name(user.getName())
                .avatar(user.getAvatar())
                .school(user.getSchool())
                .build();
    }
}