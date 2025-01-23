package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuthResponseDTO {
    private String token;
    private String type;
    private String username;
    private List<String> roles;
}