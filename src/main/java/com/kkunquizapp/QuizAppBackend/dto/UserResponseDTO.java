package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserResponseDTO {
    private UUID userId;
    private String username;
    private String email;
    private String school;
    private String name;
    private String avatar;
    private String role;
    private LocalDateTime createdAt;
    private boolean isActive;
}
