package com.kkunquizapp.QuizAppBackend.user.dto;

import lombok.Data;

@Data
public class UserRequestDTO {
    private String username;
    private String email;
    private String password;
    private String school;
    private String name;
    private String avatar;
    private String role; // "host" or "player"
}

