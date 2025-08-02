package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class UserDTO {
    private UUID userId;
    private String username;
    private String name;
    private String avatar;
    private String school;
}