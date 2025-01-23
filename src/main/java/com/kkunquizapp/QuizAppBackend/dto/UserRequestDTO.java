package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

@Data
public class UserRequestDTO {
    private String username;
    private String email;
    private String password;
    private String role; // "host" or "player"
}

