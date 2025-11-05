package com.kkunquizapp.QuizAppBackend.user.service;

import com.kkunquizapp.QuizAppBackend.auth.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.user.dto.*;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface UserService {

    AuthResponseDTO createOrUpdateOAuth2User(String email, String name);

    // ĐỔI: từ List -> Page
    Page<UserResponseDTO> getAllUsers(String token, Pageable pageable);

    UserSummaryDto getPublicById(UUID userId);

    UserResponseDTO getUserById(String userId, String token);

    void restoreUser(UUID id);

    UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO);

    void deleteUser(UUID id);

    void deleteSoftUser(UUID id, String password);

    UserResponseDTO updateUserAvatar(UUID id, MultipartFile file, String token);

    void changePassword(UUID userId, String currentPassword, String newPassword);

    String getCurrentUserId();
    User getCurrentUser();

    // ĐỔI: từ List -> Page
    Page<FriendSuggestionDTO> getFriendSuggestions(UUID currentUserId, Pageable pageable);

    void requestEmailChange(String newEmail);

    void confirmEmailChange(String token);

    void requestEmailChangeOtp(String newEmail);

    void verifyEmailChangeOtp(String code);

    void sendFriendRequest(UUID requesterId, UUID targetUserId);

    void acceptFriendRequest(UUID receiverId, UUID requestId);

    void declineFriendRequest(UUID receiverId, UUID requestId);

    void cancelFriendRequest(UUID requesterId, UUID requestId);

    Page<FriendRequestDTO> getIncomingRequestsPaged(UUID userId, Pageable pageable);

    Page<FriendRequestDTO> getOutgoingRequestsPaged(UUID userId, Pageable pageable);

    FriendshipStatusResponseDTO getFriendshipStatus(UUID me, UUID targetId);

    // ĐỔI: từ List -> Page
    Page<UserResponseDTO> getFriendsOf(UUID userId, Pageable pageable);
}
