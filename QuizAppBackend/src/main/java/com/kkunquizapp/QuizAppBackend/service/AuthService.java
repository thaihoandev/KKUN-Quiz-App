package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;

import java.util.Map;

public interface AuthService {
    UserResponseDTO register(UserRequestDTO userRequestDTO);
    Map<String, Object> verifyAndGenerateTokens(UserRequestDTO userRequestDTO);
    Map<String, Object> authenticateWithGoogleAndGenerateTokens(String accessToken);
    Map<String, String> generateTokensForUser(String username);
    String refreshAccessToken(String refreshToken);
    String getCurrentUserId();
}