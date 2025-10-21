package com.kkunquizapp.QuizAppBackend.notification.controller;

import com.kkunquizapp.QuizAppBackend.notification.dto.NotificationDTO;
import com.kkunquizapp.QuizAppBackend.auth.service.AuthService;
import com.kkunquizapp.QuizAppBackend.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@Validated
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuthService authService;

    private static final int MAX_PAGE_SIZE = 100;

    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(MAX_PAGE_SIZE) int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        if (authentication == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        try {
            String userIdStr = authService.getCurrentUserId();
            UUID userId = UUID.fromString(userIdStr);

            // Parse sort param like "createdAt,desc" or "verb,asc"
            String[] parts = sort.split(",");
            String property = parts[0];
            Sort.Direction direction = Sort.Direction.DESC;
            if (parts.length > 1) {
                direction = Sort.Direction.fromString(parts[1]);
            }
            Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), Sort.by(direction, property));

            Page<NotificationDTO> notifications = notificationService.getNotifications(userId, pageable);
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Page.empty());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
