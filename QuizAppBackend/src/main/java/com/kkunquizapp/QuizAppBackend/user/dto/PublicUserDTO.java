package com.kkunquizapp.QuizAppBackend.user.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PublicUserDTO {

    private UUID userId;
    private String username;
    private String name;
    private String avatar;
    private String school;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}