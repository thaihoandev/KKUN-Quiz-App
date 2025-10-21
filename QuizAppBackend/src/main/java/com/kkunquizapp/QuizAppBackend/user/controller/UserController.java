package com.kkunquizapp.QuizAppBackend.user.controller;

import com.kkunquizapp.QuizAppBackend.user.dto.*;
import com.kkunquizapp.QuizAppBackend.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // -------- Admin: Get all users (Pageable) --------
    @GetMapping("/")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader("Authorization") String token,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        try {
            Page<UserResponseDTO> users = userService.getAllUsers(token, pageable);
            return ResponseEntity.ok(users);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // -------- Current user: get profile --------
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(
            HttpServletRequest req,
            @RequestHeader("Authorization") String token
    ) {
        String currentUserId = userService.getCurrentUserId();
        UserResponseDTO dto = userService.getUserById(currentUserId, token);

        String etag = "\"" + dto.getUserId() + "-" + dto.getUpdatedAt().toString() + "\"";
        String ifNoneMatch = req.getHeader(HttpHeaders.IF_NONE_MATCH);

        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(304)
                    .eTag(etag)
                    .cacheControl(CacheControl.noCache().cachePrivate().mustRevalidate())
                    .build();
        }

        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(CacheControl.noCache().cachePrivate().mustRevalidate())
                .body(dto);
    }

    // -------- Get user by id --------
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(
            @PathVariable String id,
            HttpServletRequest request,
            @RequestHeader("Authorization") String token
    ) {
        UserResponseDTO dto = userService.getUserById(id, token);

        String updatedAtStr = dto.getUpdatedAt() != null ? dto.getUpdatedAt().toString() : "0";
        String etag = "\"" + dto.getUserId() + "-" + updatedAtStr + "\"";

        String ifNoneMatch = request.getHeader(HttpHeaders.IF_NONE_MATCH);
        if (etag.equals(ifNoneMatch)) {
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

    // -------- Update user by id --------
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable UUID id, @RequestBody UserRequestDTO user) {
        UserResponseDTO updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Update chính mình --------
    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> updateMe(@RequestBody UserRequestDTO user) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        UserResponseDTO updatedUser = userService.updateUser(me, user);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Hard delete (admin) --------
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully!");
    }

    // -------- Soft delete: current user --------
    @PostMapping("/me/delete")
    public ResponseEntity<String> deleteSoftMe(@Valid @RequestBody DeleteUserRequestDTO req) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        userService.deleteSoftUser(me, req.getPassword());
        return ResponseEntity.ok("User soft-deleted successfully!");
    }

    // -------- Soft delete: by id (giữ để tương thích FE cũ) --------
    @PostMapping("/{id}/delete")
    public ResponseEntity<String> deleteSoftUser(@PathVariable UUID id, @Valid @RequestBody DeleteUserRequestDTO req) {
        userService.deleteSoftUser(id, req.getPassword());
        return ResponseEntity.ok("User soft-deleted successfully!");
    }

    // -------- Restore user (admin-only) --------
    @PostMapping("/{id}/restore")
    public ResponseEntity<String> restoreUser(@PathVariable UUID id) {
        userService.restoreUser(id);
        return ResponseEntity.ok("User restored successfully!");
    }

    // -------- Update avatar (current user) --------
    @PostMapping("/me/avatar")
    public ResponseEntity<UserResponseDTO> updateMyAvatar(@RequestPart("file") MultipartFile file) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        UserResponseDTO updatedUser = userService.updateUserAvatar(me, file, null);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Update avatar (admin thay cho user khác - nếu cần) --------
    @PostMapping("/{id}/avatar")
    public ResponseEntity<UserResponseDTO> updateUserAvatar(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file
    ) {
        UserResponseDTO updatedUser = userService.updateUserAvatar(id, file, null);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Friend suggestions (current user) => Page --------
    @GetMapping("/suggestions")
    public ResponseEntity<Page<FriendSuggestionDTO>> getFriendSuggestionsForCurrent(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        UUID currentUserId = UUID.fromString(userService.getCurrentUserId());
        Page<FriendSuggestionDTO> suggestions = userService.getFriendSuggestions(currentUserId, pageable);
        return ResponseEntity.ok(suggestions);
    }

    // -------- Friend suggestions cho user cụ thể => Page --------
    @GetMapping("/{id}/suggestions")
    public ResponseEntity<Page<FriendSuggestionDTO>> getFriendSuggestionsForUser(
            @PathVariable UUID id,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<FriendSuggestionDTO> suggestions = userService.getFriendSuggestions(id, pageable);
        return ResponseEntity.ok(suggestions);
    }

    // -------- Gửi yêu cầu kết bạn (current user) --------
    @PostMapping("/me/friends/{friendId}")
    public ResponseEntity<String> sendFriendRequestForMe(@PathVariable UUID friendId) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        userService.sendFriendRequest(me, friendId);
        return ResponseEntity.ok("Friend request sent (or auto-accepted if they already requested you).");
    }

    // -------- Gửi yêu cầu kết bạn thay user khác (admin) --------
    @PostMapping("/{id}/friends/{friendId}")
    public ResponseEntity<String> sendFriendRequest(@PathVariable UUID id, @PathVariable UUID friendId) {
        userService.sendFriendRequest(id, friendId);
        return ResponseEntity.ok("Friend request sent.");
    }

    // -------- Accept/Decline/Cancel --------
    @PostMapping("/me/friend-requests/{requestId}/accept")
    public ResponseEntity<String> acceptRequest(@PathVariable UUID requestId) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        userService.acceptFriendRequest(me, requestId);
        return ResponseEntity.ok("Friend request accepted!");
    }

    @PostMapping("/me/friend-requests/{requestId}/decline")
    public ResponseEntity<String> declineRequest(@PathVariable UUID requestId) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        userService.declineFriendRequest(me, requestId);
        return ResponseEntity.ok("Friend request declined!");
    }

    @PostMapping("/me/friend-requests/{requestId}/cancel")
    public ResponseEntity<String> cancelRequest(@PathVariable UUID requestId) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        userService.cancelFriendRequest(me, requestId);
        return ResponseEntity.ok("Friend request canceled!");
    }

    // -------- Incoming friend requests (Page) --------
    @GetMapping("/me/friend-requests/incoming")
    public ResponseEntity<Page<FriendRequestDTO>> incomingPaged(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        Page<FriendRequestDTO> result = userService.getIncomingRequestsPaged(me, pageable);
        return ResponseEntity.ok(result);
    }

    // -------- Outgoing friend requests (Page) --------
    @GetMapping("/me/friend-requests/outgoing")
    public ResponseEntity<Page<FriendRequestDTO>> outgoingPaged(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        Page<FriendRequestDTO> result = userService.getOutgoingRequestsPaged(me, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me/friendships/{targetId}/status")
    public ResponseEntity<FriendshipStatusResponseDTO> getFriendshipStatus(@PathVariable UUID targetId) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        FriendshipStatusResponseDTO res = userService.getFriendshipStatus(me, targetId);
        return ResponseEntity.ok(res);
    }

    // -------- Danh sách bạn bè của current user (Page) --------
    @GetMapping("/me/friends")
    public ResponseEntity<Page<UserResponseDTO>> getMyFriends(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        Page<UserResponseDTO> friends = userService.getFriendsOf(me, pageable);
        return ResponseEntity.ok(friends);
    }

    // -------- Email change (link) --------
    @PostMapping("/me/request-email-change")
    public ResponseEntity<String> requestEmailChange(@RequestBody Map<String, String> body) {
        String newEmail = body.get("email");
        userService.requestEmailChange(newEmail);
        return ResponseEntity.ok("Verification email sent");
    }

    @GetMapping("/me/confirm-email-change")
    public ResponseEntity<String> confirmEmailChange(@RequestParam("token") String token) {
        userService.confirmEmailChange(token);
        return ResponseEntity.ok("Email updated successfully!");
    }

    // -------- Email change (OTP) --------
    @PostMapping("/me/request-email-otp")
    public ResponseEntity<String> requestEmailOtp(@RequestBody Map<String, String> body) {
        String newEmail = body.get("email");
        userService.requestEmailChangeOtp(newEmail);
        return ResponseEntity.ok("Verification code sent");
    }

    @PostMapping("/me/verify-email-otp")
    public ResponseEntity<String> verifyEmailOtp(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        userService.verifyEmailChangeOtp(code);
        return ResponseEntity.ok("Email updated successfully!");
    }
}
