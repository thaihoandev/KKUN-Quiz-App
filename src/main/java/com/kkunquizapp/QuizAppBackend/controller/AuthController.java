package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.service.AuthService;
import com.kkunquizapp.QuizAppBackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;


    @PostMapping("/register")
    public UserResponseDTO register(@RequestBody UserRequestDTO user) {
        return authService.register(user);

    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody UserRequestDTO user) {

        return authService.verify(user);
    }
    @PostMapping(value = "/google", consumes = "application/json")
    public AuthResponseDTO googleLogin(@RequestBody Map<String, String> request) {
        String accessToken = request.get("accessToken");
        if (accessToken == null || accessToken.isEmpty()) {
            throw new IllegalArgumentException("Access Token is required");
        }
        return authService.authenticateWithGoogle(accessToken);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshAccessToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        String newAccessToken = authService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }
}


