package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.*;
import com.kkunquizapp.QuizAppBackend.exception.DuplicateEntityException;
import com.kkunquizapp.QuizAppBackend.exception.InvalidRequestException;
import com.kkunquizapp.QuizAppBackend.service.AuthService;
import com.kkunquizapp.QuizAppBackend.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    // ================= Cookie helper =================
    private void writeCookie(HttpServletResponse resp, String name, String value, int maxAgeSeconds, boolean httpOnly) {
        ResponseCookie cookie = ResponseCookie.from(name, value == null ? "" : value)
                .httpOnly(httpOnly)
                .secure(false)                 // TODO: prod => true (HTTPS)
                .path("/")
                .maxAge(Duration.ofSeconds(Math.max(0, maxAgeSeconds)))
                .sameSite("Lax")               // nếu SPA khác domain -> dùng "None" + secure=true
                .build();
        resp.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ================= Register =================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRequestDTO user, HttpServletResponse response) {
        try {
            UserResponseDTO userResponse = authService.register(user);
            Map<String, String> tokens = authService.generateTokensForUser(userResponse.getUsername());

            writeCookie(response, "accessToken", tokens.get("accessToken"), 60 * 60, true);
            writeCookie(response, "refreshToken", tokens.get("refreshToken"), 7 * 24 * 60 * 60, true);

            return ResponseEntity.ok(userResponse); // FE nhận đúng DTO từ DB
        } catch (InvalidRequestException | DuplicateEntityException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(LocalDateTime.now(), "Registration failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error registering user", e.getMessage()));
        }
    }

    // ================= Username/Password login =================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserRequestDTO user, HttpServletResponse response) {
        try {
            Map<String, Object> authResult = authService.verifyAndGenerateTokens(user);

            writeCookie(response, "accessToken", (String) authResult.get("accessToken"), 60 * 60, true);
            writeCookie(response, "refreshToken", (String) authResult.get("refreshToken"), 7 * 24 * 60 * 60, true);

            // FE của bạn hiện đang đọc response.userData.*, nên trả cả map như cũ
            return ResponseEntity.ok(authResult);
        } catch (InvalidRequestException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(LocalDateTime.now(), "Login failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error logging in", e.getMessage()));
        }
    }

    @PostMapping(value = "/google", consumes = "application/json")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request, HttpServletResponse response) {
        try {
            String accessToken = request.get("accessToken");
            if (accessToken == null || accessToken.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(LocalDateTime.now(), "Access Token is required", ""));
            }

            Map<String, Object> authResult = authService.authenticateWithGoogleAndGenerateTokens(accessToken);

            writeCookie(response, "accessToken", (String) authResult.get("accessToken"), 60 * 60, true);
            writeCookie(response, "refreshToken", (String) authResult.get("refreshToken"), 7 * 24 * 60 * 60, true);

            // Trả đúng dữ liệu DB cho FE:
//            return ResponseEntity.ok(authResult.get("userData"));

            // Hoặc nếu FE muốn giống /login (có cả accessToken/refreshToken trong body)
             return ResponseEntity.ok(authResult);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(LocalDateTime.now(), "Google login failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error with Google login", e.getMessage()));
        }
    }


    // ================= Refresh access token =================
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshAccessToken(@CookieValue(name = "refreshToken", required = false) String refreshToken,
                                                HttpServletResponse response) {
        try {
            if (refreshToken == null || refreshToken.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(LocalDateTime.now(), "Refresh Token is required", ""));
            }
            String newAccessToken = authService.refreshAccessToken(refreshToken);
            writeCookie(response, "accessToken", newAccessToken, 60 * 60, true);
            return ResponseEntity.ok(Map.of("message", "Access token refreshed"));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(new ErrorResponse(LocalDateTime.now(), e.getReason(), ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error refreshing token: " + e.getMessage(), ""));
        }
    }

    // ================= Logout =================
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Xoá cookie bằng cách set Max-Age=0
        writeCookie(response, "accessToken", null, 0, true);
        writeCookie(response, "refreshToken", null, 0, true);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // ================= Change password =================
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequestDTO req) {
        try {
            UUID userId = UUID.fromString(authService.getCurrentUserId());
            userService.changePassword(userId, req.getCurrentPassword(), req.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(LocalDateTime.now(), "Change password failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(LocalDateTime.now(), "Error changing password", e.getMessage()));
        }
    }
}
