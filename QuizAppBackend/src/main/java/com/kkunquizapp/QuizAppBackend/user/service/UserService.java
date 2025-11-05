package com.kkunquizapp.QuizAppBackend.user.service;

import com.kkunquizapp.QuizAppBackend.auth.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.user.dto.*;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface UserService {

    // ===== OAuth2 =====
    AuthResponseDTO createOrUpdateOAuth2User(String email, String name);

    // ===== User CRUD =====
    Page<UserResponseDTO> getAllUsers(Pageable pageable);

    UserResponseDTO getUserById(String userId);

    UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO);

    void deleteUser(UUID id);

    void deleteSoftUser(UUID id, String password);

    void restoreUser(UUID id);

    // ===== Avatar =====
    UserResponseDTO updateUserAvatar(UUID id, MultipartFile file, String token);

    // ===== Password =====
    void changePassword(UUID userId, String currentPassword, String newPassword);

    // ===== Email change (link) =====
    void requestEmailChange(String newEmail);

    void confirmEmailChange(String token);

    // ===== Email change (OTP) =====
    void requestEmailChangeOtp(String newEmail);

    void verifyEmailChangeOtp(String code);

    // ===== Friend system =====
    void sendFriendRequest(UUID requesterId, UUID targetUserId);

    void acceptFriendRequest(UUID receiverId, UUID requestId);

    void declineFriendRequest(UUID receiverId, UUID requestId);

    void cancelFriendRequest(UUID requesterId, UUID requestId);

    Page<FriendRequestDTO> getIncomingRequestsPaged(UUID userId, Pageable pageable);

    Page<FriendRequestDTO> getOutgoingRequestsPaged(UUID userId, Pageable pageable);

    Page<FriendSuggestionDTO> getFriendSuggestions(UUID currentUserId, Pageable pageable);

    Page<UserResponseDTO> getFriendsOf(UUID userId, Pageable pageable);

    FriendshipStatusResponseDTO getFriendshipStatus(UUID me, UUID targetId);

    // ===== Current user =====
    String getCurrentUserId(); // Giữ lại cho tương thích (nhưng controller mới không cần gọi)
    User getCurrentUser();

    // ===== Public =====
    UserSummaryDto getPublicById(UUID userId);
}
