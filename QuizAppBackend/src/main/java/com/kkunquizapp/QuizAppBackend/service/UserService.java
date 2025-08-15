package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface UserService {
    AuthResponseDTO createOrUpdateOAuth2User(String email, String name);
    List<UserResponseDTO> getAllUsers(String token);
    UserResponseDTO getUserById(String userId, String token);
    UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO);
    void deleteUser(UUID id);
    void deleteSoftUser(UUID id, String password);
    void restoreUser(UUID id);
    UserResponseDTO updateUserAvatar(UUID id, MultipartFile file, String token);
    String getCurrentUserId();
    void changePassword(UUID userId, String currentPassword, String newPassword);
    List<FriendSuggestionDTO> getFriendSuggestions(UUID currentUserId, int page, int size);

    void addFriend(UUID requesterId, UUID targetUserId);

    void requestEmailChange(String newEmail);
    void confirmEmailChange(String token);
    void requestEmailChangeOtp(String newEmail);
    void verifyEmailChangeOtp(String code);

    void sendFriendRequest(UUID requesterId, UUID targetUserId);
    void acceptFriendRequest(UUID receiverId, UUID requestId);
    void declineFriendRequest(UUID receiverId, UUID requestId);
    void cancelFriendRequest(UUID requesterId, UUID requestId);
    PageResponse<FriendRequestDTO> getIncomingRequestsPaged(UUID userId, int page, int size);
    PageResponse<FriendRequestDTO> getOutgoingRequestsPaged(UUID userId, int page, int size);

    FriendshipStatusResponseDTO getFriendshipStatus(UUID me, UUID targetId);
    List<UserResponseDTO> getFriendsOf(UUID userId);

}