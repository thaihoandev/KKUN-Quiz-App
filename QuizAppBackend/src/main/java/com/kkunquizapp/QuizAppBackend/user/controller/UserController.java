package com.kkunquizapp.QuizAppBackend.user.controller;

import com.kkunquizapp.QuizAppBackend.user.dto.*;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    // ============================================================
    // ADMIN: Get all users (Pageable)
    // ============================================================
    @GetMapping("/")
    public ResponseEntity<?> getAllUsers(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        log.info("Fetching all users with pageable: {}", pageable);
        Page<UserResponseDTO> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    // ============================================================
    // CURRENT USER: Get profile
    // ============================================================
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(
            HttpServletRequest req,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Fetching current user profile: {}", currentUser.getUserId());

        UserResponseDTO dto = userService.getUserById(currentUser.getUserId().toString());

        String etag = "\"" + dto.getUserId() + "-" + dto.getUpdatedAt().toString() + "\"";
        String ifNoneMatch = req.getHeader(HttpHeaders.IF_NONE_MATCH);

        if (etag.equals(ifNoneMatch)) {
            log.debug("User profile not modified - returning 304");
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .cacheControl(CacheControl.noCache().cachePrivate().mustRevalidate())
                    .build();
        }

        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(CacheControl.noCache().cachePrivate().mustRevalidate())
                .body(dto);
    }

    // ============================================================
    // Get user by id (PUBLIC)
    // Note: This comes AFTER /me to avoid route conflict
    // ============================================================
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(
            @PathVariable String id,
            HttpServletRequest request
    ) {
        log.info("Fetching user by id: {}", id);

        UserResponseDTO dto = userService.getUserById(id);

        String updatedAtStr = dto.getUpdatedAt() != null ? dto.getUpdatedAt().toString() : "0";
        String etag = "\"" + dto.getUserId() + "-" + updatedAtStr + "\"";

        String ifNoneMatch = request.getHeader(HttpHeaders.IF_NONE_MATCH);
        if (etag.equals(ifNoneMatch)) {
            log.debug("User profile not modified - returning 304");
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .cacheControl(CacheControl.noCache().cachePrivate().mustRevalidate())
                    .build();
        }

        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(CacheControl.noCache().cachePrivate().mustRevalidate())
                .body(dto);
    }

    // ============================================================
    // Update user by id (ADMIN)
    // ============================================================
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable UUID id,
            @RequestBody UserRequestDTO user
    ) {
        log.info("Updating user by id: {}", id);

        UserResponseDTO updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }

    // ============================================================
    // Update current user (/me endpoint)
    // ============================================================
    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> updateCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody UserRequestDTO patch
    ) {
        log.info("Updating current user: {}", currentUser.getUserId());

        UserResponseDTO updated = userService.updateUser(currentUser.getUserId(), patch);
        return ResponseEntity.ok(updated);
    }
    // ============================================================
    // Hard delete user (ADMIN)
    // ============================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        log.info("Hard deleting user: {}", id);

        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully!");
    }

    // ============================================================
    // Soft delete: current user
    // ============================================================
    @PostMapping("/me/delete")
    public ResponseEntity<String> deleteSoftMe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody DeleteUserRequestDTO req
    ) {
        log.info("Soft deleting current user: {}", currentUser.getUserId());

        userService.deleteSoftUser(currentUser.getUserId(), req.getPassword());
        return ResponseEntity.ok("User soft-deleted successfully!");
    }

    // ============================================================
    // Soft delete: by id (admin)
    // ============================================================
    @PostMapping("/{id}/delete")
    public ResponseEntity<String> deleteSoftUser(
            @PathVariable UUID id,
            @Valid @RequestBody DeleteUserRequestDTO req
    ) {
        log.info("Soft deleting user: {}", id);

        userService.deleteSoftUser(id, req.getPassword());
        return ResponseEntity.ok("User soft-deleted successfully!");
    }

    // ============================================================
    // Restore user (ADMIN)
    // ============================================================
    @PostMapping("/{id}/restore")
    public ResponseEntity<String> restoreUser(@PathVariable UUID id) {
        log.info("Restoring user: {}", id);

        userService.restoreUser(id);
        return ResponseEntity.ok("User restored successfully!");
    }

    // ============================================================
    // Update avatar: current user
    // ============================================================
    @PostMapping("/me/avatar")
    public ResponseEntity<UserResponseDTO> updateMyAvatar(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestPart("file") MultipartFile file
    ) {
        log.info("Updating avatar for current user: {}", currentUser.getUserId());

        UserResponseDTO updatedUser = userService.updateUserAvatar(currentUser.getUserId(), file);
        return ResponseEntity.ok(updatedUser);
    }

    // ============================================================
    // Update avatar: by id (admin)
    // ============================================================
    @PostMapping("/{id}/avatar")
    public ResponseEntity<UserResponseDTO> updateUserAvatar(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file
    ) {
        log.info("Updating avatar for user: {}", id);

        UserResponseDTO updatedUser = userService.updateUserAvatar(id, file);
        return ResponseEntity.ok(updatedUser);
    }

    // ============================================================
    // Friend suggestions: current user
    // ============================================================
    @GetMapping("/me/friends/suggestions")
    public ResponseEntity<Page<FriendSuggestionDTO>> getFriendSuggestionsForCurrent(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        log.info("Fetching friend suggestions for current user: {}", currentUser.getUserId());

        Page<FriendSuggestionDTO> suggestions =
                userService.getFriendSuggestions(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(suggestions);
    }



    // ============================================================
    // Send friend request: current user
    // ============================================================
    @PostMapping("/me/friends/{friendId}")
    public ResponseEntity<String> sendFriendRequestForMe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID friendId
    ) {
        log.info("Sending friend request from {} to {}", currentUser.getUserId(), friendId);

        userService.sendFriendRequest(currentUser.getUserId(), friendId);
        return ResponseEntity.ok("Friend request sent (or auto-accepted if they already requested you).");
    }

    // ============================================================
    // Send friend request: admin action
    // ============================================================
    @PostMapping("/{id}/friends/{friendId}")
    public ResponseEntity<String> sendFriendRequest(
            @PathVariable UUID id,
            @PathVariable UUID friendId
    ) {
        log.info("Sending friend request from {} to {} (admin action)", id, friendId);

        userService.sendFriendRequest(id, friendId);
        return ResponseEntity.ok("Friend request sent.");
    }

    // ============================================================
    // Accept friend request
    // ============================================================
    @PostMapping("/me/friend-requests/{requestId}/accept")
    public ResponseEntity<String> acceptRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID requestId
    ) {
        log.info("Accepting friend request {} for user {}", requestId, currentUser.getUserId());

        userService.acceptFriendRequest(currentUser.getUserId(), requestId);
        return ResponseEntity.ok("Friend request accepted!");
    }

    // ============================================================
    // Decline friend request
    // ============================================================
    @PostMapping("/me/friend-requests/{requestId}/decline")
    public ResponseEntity<String> declineRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID requestId
    ) {
        log.info("Declining friend request {} for user {}", requestId, currentUser.getUserId());

        userService.declineFriendRequest(currentUser.getUserId(), requestId);
        return ResponseEntity.ok("Friend request declined!");
    }

    // ============================================================
    // Cancel friend request
    // ============================================================
    @PostMapping("/me/friend-requests/{requestId}/cancel")
    public ResponseEntity<String> cancelRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID requestId
    ) {
        log.info("Canceling friend request {} for user {}", requestId, currentUser.getUserId());

        userService.cancelFriendRequest(currentUser.getUserId(), requestId);
        return ResponseEntity.ok("Friend request canceled!");
    }

    // ============================================================
    // Incoming friend requests (pageable)
    // ============================================================
    @GetMapping("/me/friend-requests/incoming")
    public ResponseEntity<Page<FriendRequestDTO>> incomingPaged(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        log.info("Fetching incoming friend requests for user: {}", currentUser.getUserId());

        Page<FriendRequestDTO> result = userService.getIncomingRequestsPaged(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(result);
    }

    // ============================================================
    // Outgoing friend requests (pageable)
    // ============================================================
    @GetMapping("/me/friend-requests/outgoing")
    public ResponseEntity<Page<FriendRequestDTO>> outgoingPaged(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        log.info("Fetching outgoing friend requests for user: {}", currentUser.getUserId());

        Page<FriendRequestDTO> result = userService.getOutgoingRequestsPaged(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(result);
    }

    // ============================================================
    // Check friendship status
    // ============================================================
    @GetMapping("/me/friendships/{targetId}/status")
    public ResponseEntity<FriendshipStatusResponseDTO> getFriendshipStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID targetId
    ) {
        log.info("Checking friendship status between {} and {}", currentUser.getUserId(), targetId);

        FriendshipStatusResponseDTO res = userService.getFriendshipStatus(currentUser.getUserId(), targetId);
        return ResponseEntity.ok(res);
    }

    // ============================================================
    // Get user's friend list
    // ============================================================
    @GetMapping("/me/friends")
    public ResponseEntity<Page<UserResponseDTO>> getMyFriends(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        log.info("Fetching friends list for user: {}", currentUser.getUserId());

        Page<UserResponseDTO> friends = userService.getFriendsOf(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(friends);
    }

    // ============================================================
    // Request email change (link-based)
    // ============================================================
    @PostMapping("/me/request-email-change")
    public ResponseEntity<String> requestEmailChange(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> body
    ) {
        log.info("Requesting email change for user {} to: {}", currentUser.getUserId(), body.get("email"));

        userService.requestEmailChange(body.get("email"));
        return ResponseEntity.ok("Verification email sent");
    }

    // ============================================================
    // Confirm email change (link-based)
    // ============================================================
    @GetMapping("/me/confirm-email-change")
    public ResponseEntity<String> confirmEmailChange(@RequestParam("token") String token) {
        log.info("Confirming email change with token");

        userService.confirmEmailChange(token);
        return ResponseEntity.ok("Email updated successfully!");
    }

    // ============================================================
    // Request email change OTP
    // ============================================================
    @PostMapping("/me/request-email-otp")
    public ResponseEntity<String> requestEmailOtp(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> body
    ) {
        log.info("Requesting email change OTP for user {} to: {}", currentUser.getUserId(), body.get("email"));

        userService.requestEmailChangeOtp(body.get("email"));
        return ResponseEntity.ok("Verification code sent");
    }

    // ============================================================
    // Verify email change OTP
    // ============================================================
    @PostMapping("/me/verify-email-otp")
    public ResponseEntity<String> verifyEmailOtp(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> body
    ) {
        log.info("Verifying email change OTP for user {}", currentUser.getUserId());

        userService.verifyEmailChangeOtp(body.get("code"));
        return ResponseEntity.ok("Email updated successfully!");
    }
}