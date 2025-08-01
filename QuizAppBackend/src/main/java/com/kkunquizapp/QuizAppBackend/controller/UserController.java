package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.exception.UserNotFoundException;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.service.JwtService;
import com.kkunquizapp.QuizAppBackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;
    @Autowired
    private JwtService jwtService;

    // Get all users
    @GetMapping("/")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String token) {
        try {
            List<UserResponseDTO> users = userService.getAllUsers(token);
            return ResponseEntity.ok(users);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // API lấy thông tin người dùng của chính mình
    @GetMapping("/me")
    public UserResponseDTO getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return userService.getUserById(jwt.getClaim("userId"), jwt.getTokenValue());
    }

    @GetMapping("/{id}")
    public UserResponseDTO getUserById(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        return userService.getUserById(id, jwt.getTokenValue());
    }

    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable UUID id, @RequestBody UserRequestDTO user) {
        UserResponseDTO updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }

    // Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully!");
    }

    // Update user avatar
    @PostMapping("/{id}/avatar")
    public ResponseEntity<UserResponseDTO> updateUserAvatar(@AuthenticationPrincipal Jwt jwt,
                                                            @PathVariable UUID id,
                                                            @RequestPart("file") MultipartFile file) {
        UserResponseDTO updatedUser = userService.updateUserAvatar(id, file, jwt.getTokenValue());
        return ResponseEntity.ok(updatedUser);
    }
}