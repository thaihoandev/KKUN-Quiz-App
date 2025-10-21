package com.kkunquizapp.QuizAppBackend.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String type;
    private String username;
    private List<String> roles;
}