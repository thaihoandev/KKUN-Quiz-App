package com.kkunquizapp.QuizAppBackend.auth.service;

import com.kkunquizapp.QuizAppBackend.user.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.user.dto.UserResponseDTO;

import java.util.Map;

public interface AuthService {
    UserResponseDTO register(UserRequestDTO userRequestDTO);
    Map<String, Object> verifyAndGenerateTokens(UserRequestDTO userRequestDTO);
    Map<String, Object> authenticateWithGoogleAndGenerateTokens(String accessToken);
    Map<String, String> generateTokensForUser(String username);
    String refreshAccessToken(String refreshToken);
    String getCurrentUserId();
}