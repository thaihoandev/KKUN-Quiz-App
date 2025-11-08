package com.kkunquizapp.QuizAppBackend.user.controller;

import com.kkunquizapp.QuizAppBackend.user.dto.*;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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
public class UserController {

    @Autowired
    private UserService userService;

    // -------- Admin: Get all users (Pageable) --------
    @GetMapping("/")
    public ResponseEntity<?> getAllUsers(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<UserResponseDTO> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    // -------- Current user: get profile --------
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(
            HttpServletRequest req,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UserResponseDTO dto = userService.getUserById(currentUser.getUserId().toString());

        String etag = "\"" + dto.getUserId() + "-" + dto.getUpdatedAt().toString() + "\"";
        String ifNoneMatch = req.getHeader(HttpHeaders.IF_NONE_MATCH);

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

    // -------- Get user by id --------
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(
            @PathVariable String id,
            HttpServletRequest request
    ) {
        UserResponseDTO dto = userService.getUserById(id);

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

    // -------- Update user by id (admin) --------
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable UUID id,
            @RequestBody UserRequestDTO user
    ) {
        UserResponseDTO updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Update chính mình --------
    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> updateMe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody UserRequestDTO user
    ) {
        UserResponseDTO updatedUser = userService.updateUser(currentUser.getUserId(), user);
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
    public ResponseEntity<String> deleteSoftMe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody DeleteUserRequestDTO req
    ) {
        userService.deleteSoftUser(currentUser.getUserId(), req.getPassword());
        return ResponseEntity.ok("User soft-deleted successfully!");
    }

    // -------- Soft delete: by id (tương thích FE cũ) --------
    @PostMapping("/{id}/delete")
    public ResponseEntity<String> deleteSoftUser(
            @PathVariable UUID id,
            @Valid @RequestBody DeleteUserRequestDTO req
    ) {
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
    public ResponseEntity<UserResponseDTO> updateMyAvatar(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestPart("file") MultipartFile file
    ) {
        UserResponseDTO updatedUser = userService.updateUserAvatar(currentUser.getUserId(), file);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Update avatar (admin thay user khác) --------
    @PostMapping("/{id}/avatar")
    public ResponseEntity<UserResponseDTO> updateUserAvatar(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file
    ) {
        UserResponseDTO updatedUser = userService.updateUserAvatar(id, file);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Friend suggestions (current user) --------
    @GetMapping("/me/friends/suggestions")
    public ResponseEntity<Page<FriendSuggestionDTO>> getFriendSuggestionsForCurrent(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<FriendSuggestionDTO> suggestions =
                userService.getFriendSuggestions(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(suggestions);
    }

    // -------- Friend suggestions cho user cụ thể --------
    @GetMapping("/me/friends/{id}/suggestions")
    public ResponseEntity<Page<FriendSuggestionDTO>> getFriendSuggestionsForUser(
            @PathVariable UUID id,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<FriendSuggestionDTO> suggestions = userService.getFriendSuggestions(id, pageable);
        return ResponseEntity.ok(suggestions);
    }

    // -------- Gửi yêu cầu kết bạn (current user) --------
    @PostMapping("/me/friends/{friendId}")
    public ResponseEntity<String> sendFriendRequestForMe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID friendId
    ) {
        userService.sendFriendRequest(currentUser.getUserId(), friendId);
        return ResponseEntity.ok("Friend request sent (or auto-accepted if they already requested you).");
    }

    // -------- Gửi yêu cầu kết bạn thay user khác (admin) --------
    @PostMapping("/{id}/friends/{friendId}")
    public ResponseEntity<String> sendFriendRequest(
            @PathVariable UUID id,
            @PathVariable UUID friendId
    ) {
        userService.sendFriendRequest(id, friendId);
        return ResponseEntity.ok("Friend request sent.");
    }

    // -------- Accept/Decline/Cancel --------
    @PostMapping("/me/friend-requests/{requestId}/accept")
    public ResponseEntity<String> acceptRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID requestId
    ) {
        userService.acceptFriendRequest(currentUser.getUserId(), requestId);
        return ResponseEntity.ok("Friend request accepted!");
    }

    @PostMapping("/me/friend-requests/{requestId}/decline")
    public ResponseEntity<String> declineRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID requestId
    ) {
        userService.declineFriendRequest(currentUser.getUserId(), requestId);
        return ResponseEntity.ok("Friend request declined!");
    }

    @PostMapping("/me/friend-requests/{requestId}/cancel")
    public ResponseEntity<String> cancelRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID requestId
    ) {
        userService.cancelFriendRequest(currentUser.getUserId(), requestId);
        return ResponseEntity.ok("Friend request canceled!");
    }

    // -------- Incoming friend requests --------
    @GetMapping("/me/friend-requests/incoming")
    public ResponseEntity<Page<FriendRequestDTO>> incomingPaged(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<FriendRequestDTO> result = userService.getIncomingRequestsPaged(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(result);
    }

    // -------- Outgoing friend requests --------
    @GetMapping("/me/friend-requests/outgoing")
    public ResponseEntity<Page<FriendRequestDTO>> outgoingPaged(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<FriendRequestDTO> result = userService.getOutgoingRequestsPaged(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(result);
    }

    // -------- Check friendship status --------
    @GetMapping("/me/friendships/{targetId}/status")
    public ResponseEntity<FriendshipStatusResponseDTO> getFriendshipStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID targetId
    ) {
        FriendshipStatusResponseDTO res = userService.getFriendshipStatus(currentUser.getUserId(), targetId);
        return ResponseEntity.ok(res);
    }

    // -------- Danh sách bạn bè --------
    @GetMapping("/me/friends")
    public ResponseEntity<Page<UserResponseDTO>> getMyFriends(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<UserResponseDTO> friends = userService.getFriendsOf(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(friends);
    }

    // -------- Email change (link) --------
    @PostMapping("/me/request-email-change")
    public ResponseEntity<String> requestEmailChange(
            @RequestBody Map<String, String> body
    ) {
        userService.requestEmailChange(body.get("email"));
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
        userService.requestEmailChangeOtp(body.get("email"));
        return ResponseEntity.ok("Verification code sent");
    }

    @PostMapping("/me/verify-email-otp")
    public ResponseEntity<String> verifyEmailOtp(@RequestBody Map<String, String> body) {
        userService.verifyEmailChangeOtp(body.get("code"));
        return ResponseEntity.ok("Email updated successfully!");
    }
}
