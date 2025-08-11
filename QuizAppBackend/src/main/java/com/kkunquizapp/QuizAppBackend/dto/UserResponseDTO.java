package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class UserResponseDTO {
    private UUID userId;
    private String username;
    private String email;
    private String school;
    private String name;
    private String avatar;
    private List<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isActive;
}
