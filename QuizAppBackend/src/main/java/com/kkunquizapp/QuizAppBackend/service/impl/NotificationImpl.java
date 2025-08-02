package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.NotificationDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserDTO;
import com.kkunquizapp.QuizAppBackend.model.Notification;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.repo.NotificationRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

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

    public void createNotification(UUID userId, UUID actorId, String verb, String targetType, UUID targetId) {
        if (userId.equals(actorId)) return; // No self-notification

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new RuntimeException("Actor not found"));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setActor(actor);
        notification.setVerb(verb);
        notification.setTargetType(targetType);
        notification.setTargetId(targetId);
        notificationRepository.save(notification);

        // Send real-time notification
        NotificationDTO notificationDTO = mapToNotificationDTO(notification);
        messagingTemplate.convertAndSend("/topic/notifications/user/" + userId, notificationDTO);
    }

    public List<NotificationDTO> getNotifications(UUID userId) {
        List<Notification> notifications = notificationRepository.findByUserUserId(userId);
        return notifications.stream()
                .map(this::mapToNotificationDTO)
                .collect(Collectors.toList());
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
        return notificationDTO;
    }

    private UserDTO mapToUserDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(user.getUserId());
        userDTO.setUsername(user.getUsername());
        userDTO.setName(user.getName());
        userDTO.setAvatar(user.getAvatar());
        userDTO.setSchool(user.getSchool());
        return userDTO;
    }
}
