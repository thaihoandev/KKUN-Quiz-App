package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.User;
import org.springframework.http.ResponseEntity;

public interface AuthService {
    AuthResponseDTO authenticateWithGoogle(String accessToken);
}
