package com.kkunquizapp.QuizAppBackend.auth.service;

import com.kkunquizapp.QuizAppBackend.user.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.user.dto.UserResponseDTO;

import java.util.Map;

public interface AuthService {

    /**
     * Đăng ký tài khoản mới
     */
    UserResponseDTO register(UserRequestDTO userRequestDTO);

    /**
     * Xác thực username/password và cấp token
     */
    Map<String, Object> verifyAndGenerateTokens(UserRequestDTO userRequestDTO);

    /**
     * Xác thực Google token và cấp token
     */
    Map<String, Object> authenticateWithGoogleAndGenerateTokens(String accessToken);

    /**
     * Cấp token mới cho user (dùng khi register/login)
     * Return: {accessToken, refreshToken}
     */
    Map<String, String> generateTokensForUser(String username);

    /**
     * Refresh access token từ refresh token (WITH RTR)
     * ✅ Invalidate old token
     * ✅ Issue new access token + new refresh token
     */
    Map<String, String> refreshAccessToken(String oldRefreshToken);

    /**
     * Logout - Revoke refresh token
     */
    void logout(String refreshToken);

    /**
     * Lấy user ID từ SecurityContext
     */
    String getCurrentUserId();
}