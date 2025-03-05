package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.User;
import org.springframework.http.ResponseEntity;

public interface AuthService {
    UserResponseDTO register(UserRequestDTO userRequestDTO);

    AuthResponseDTO verify(UserRequestDTO userRequestDTO);
    AuthResponseDTO authenticateWithGoogle(String accessToken);
    String getCurrentUserId();
    String refreshAccessToken(String refreshToken);
}
