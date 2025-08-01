package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface UserService {
    AuthResponseDTO createOrUpdateOAuth2User(String email, String name);
    List<UserResponseDTO> getAllUsers(String token);
    UserResponseDTO getUserById(String userId, String token);
    UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO);
    void deleteUser(UUID id);
    UserResponseDTO updateUserAvatar(UUID id, MultipartFile file, String token);
}