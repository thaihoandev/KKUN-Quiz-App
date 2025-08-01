package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.ErrorResponse;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.exception.DuplicateEntityException;
import com.kkunquizapp.QuizAppBackend.exception.InvalidRequestException;
import com.kkunquizapp.QuizAppBackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRequestDTO user, HttpServletResponse response) {
        try {
            UserResponseDTO userResponse = authService.register(user);

            // Generate tokens for the new user
            Map<String, String> tokens = authService.generateTokensForUser(userResponse.getUsername());

            // Set accessToken as HttpOnly cookie
            Cookie accessTokenCookie = new Cookie("accessToken", tokens.get("accessToken"));
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(1 * 60 * 60);
            response.addCookie(accessTokenCookie);

            // Set refreshToken as HttpOnly cookie
            Cookie refreshTokenCookie = new Cookie("refreshToken", tokens.get("refreshToken"));
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60);
            response.addCookie(refreshTokenCookie);

            // Return UserResponseDTO directly
            return ResponseEntity.ok(userResponse);
        } catch (InvalidRequestException | DuplicateEntityException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(LocalDateTime.now(), "Registration failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error registering user", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserRequestDTO user, HttpServletResponse response) {
        try {
            Map<String, Object> authResult = authService.verifyAndGenerateTokens(user);

            // Set accessToken as HttpOnly cookie
            Cookie accessTokenCookie = new Cookie("accessToken", (String) authResult.get("accessToken"));
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(1 * 60 * 60); // 1 hour
            response.addCookie(accessTokenCookie);

            // Set refreshToken as HttpOnly cookie
            Cookie refreshTokenCookie = new Cookie("refreshToken", (String) authResult.get("refreshToken"));
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(refreshTokenCookie);

            // Return user data directly
            return ResponseEntity.ok(authResult);
        } catch (InvalidRequestException | IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(LocalDateTime.now(), "Login failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error logging in", e.getMessage()));
        }
    }

    @PostMapping(value = "/google", consumes = "application/json")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request, HttpServletResponse response) {
        try {
            String accessToken = request.get("accessToken");
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(LocalDateTime.now(), "Access Token is required", ""));
            }

            Map<String, Object> authResult = authService.authenticateWithGoogleAndGenerateTokens(accessToken);

            Cookie accessTokenCookie = new Cookie("accessToken", (String) authResult.get("accessToken"));
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(1 * 60 * 60);
            response.addCookie(accessTokenCookie);

            Cookie refreshTokenCookie = new Cookie("refreshToken", (String) authResult.get("refreshToken"));
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false);
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(refreshTokenCookie);

            return ResponseEntity.ok(authResult.get("userData"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(LocalDateTime.now(), "Google login failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error with Google login", e.getMessage()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshAccessToken(@CookieValue(name = "refreshToken", required = false) String refreshToken, HttpServletResponse response) {
        try {
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(LocalDateTime.now(), "Refresh Token is required", ""));
            }

            String newAccessToken = authService.refreshAccessToken(refreshToken);

            Cookie accessTokenCookie = new Cookie("accessToken", newAccessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(1 * 60 * 60);
            response.addCookie(accessTokenCookie);

            return ResponseEntity.ok(Map.of("message", "Access token refreshed"));
        } catch (ResponseStatusException e) {
            return ResponseEntity
                    .status(e.getStatusCode())
                    .body(new ErrorResponse(LocalDateTime.now(), e.getReason(), ""));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error refreshing token: " + e.getMessage(), ""));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear accessToken cookie
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0);
        response.addCookie(accessTokenCookie);

        // Clear refreshToken cookie
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // Expire immediately
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}