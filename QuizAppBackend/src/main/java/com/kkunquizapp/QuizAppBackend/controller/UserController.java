package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.DeleteUserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.FriendSuggestionDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // -------- Admin: Get all users --------
    @GetMapping("/")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String token) {
        try {
            List<UserResponseDTO> users = userService.getAllUsers(token);
            return ResponseEntity.ok(users);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // -------- Current user: get profile (giống cách lấy userId ở PostController) --------
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(HttpServletRequest req) {
        String currentUserId = userService.getCurrentUserId();
        // lấy cả updatedAt (nếu DTO chưa có, bổ sung trường hoặc trả riêng)
        UserResponseDTO dto = userService.getUserById(currentUserId, null);

        // Ví dụ etag dựa trên updatedAt + userId để ổn định
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

    // -------- Get user by id (giữ nguyên cho các màn admin/khách xem người khác) --------
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(
            @PathVariable String id,
            HttpServletRequest request
    ) {
        // Lấy dữ liệu (service đã tự ẩn field nhạy cảm nếu không phải owner/admin)
        UserResponseDTO dto = userService.getUserById(id, null);

        // Tạo ETag từ userId + updatedAt (đảm bảo thay đổi khi hồ sơ đổi)
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

    // -------- Update user by id (giữ nguyên; có thể thêm /me nếu muốn) --------
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable UUID id, @RequestBody UserRequestDTO user) {
        UserResponseDTO updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }

    // (tuỳ chọn) Update chính mình - semantic hơn
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

    // -------- Soft delete: dùng current user giống PostController --------
    @PostMapping("/me/delete")
    public ResponseEntity<String> deleteSoftMe(@Valid @RequestBody DeleteUserRequestDTO req) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        userService.deleteSoftUser(me, req.getPassword());
        return ResponseEntity.ok("User soft-deleted successfully!");
    }

    // (giữ endpoint cũ nếu FE đang dùng) — sẽ vẫn kiểm tra quyền & password ở service
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

    // (giữ endpoint cũ nếu cần cho admin thay avatar người khác)
    @PostMapping("/{id}/avatar")
    public ResponseEntity<UserResponseDTO> updateUserAvatar(@PathVariable UUID id,
                                                            @RequestPart("file") MultipartFile file) {
        UserResponseDTO updatedUser = userService.updateUserAvatar(id, file, null);
        return ResponseEntity.ok(updatedUser);
    }

    // -------- Friend suggestions (current user) --------
    @GetMapping("/suggestions")
    public ResponseEntity<List<FriendSuggestionDTO>> getFriendSuggestionsForCurrent(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        UUID currentUserId = UUID.fromString(userService.getCurrentUserId());
        List<FriendSuggestionDTO> suggestions = userService.getFriendSuggestions(currentUserId, page, size);
        return ResponseEntity.ok(suggestions);
    }

    // (tuỳ chọn) Friend suggestions cho user cụ thể (admin hoặc owner)
    @GetMapping("/{id}/suggestions")
    public ResponseEntity<List<FriendSuggestionDTO>> getFriendSuggestionsForUser(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // Quyền owner/admin được kiểm ở service (hoặc có thể check sớm ở đây)
        List<FriendSuggestionDTO> suggestions = userService.getFriendSuggestions(id, page, size);
        return ResponseEntity.ok(suggestions);
    }

    // -------- Add friend: current user giống PostController --------
    @PostMapping("/me/friends/{friendId}")
    public ResponseEntity<String> addFriendForMe(@PathVariable UUID friendId) {
        UUID me = UUID.fromString(userService.getCurrentUserId());
        userService.addFriend(me, friendId);
        return ResponseEntity.ok("Friend added successfully!");
    }

    // (giữ endpoint cũ nếu FE đang gọi) — service vẫn kiểm quyền
    @PostMapping("/{id}/friends/{friendId}")
    public ResponseEntity<String> addFriend(@PathVariable UUID id, @PathVariable UUID friendId) {
        userService.addFriend(id, friendId);
        return ResponseEntity.ok("Friend added successfully!");
    }
}
