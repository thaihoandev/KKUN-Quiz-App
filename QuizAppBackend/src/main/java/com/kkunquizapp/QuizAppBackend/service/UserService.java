package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;

import java.util.List;
import java.util.UUID;

public interface UserService {

    AuthResponseDTO createOrUpdateOAuth2User(String email, String name);
    List<UserResponseDTO> getAllUsers(String token);

    UserResponseDTO getUserById(String id, String token);


    UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO);

    void deleteUser(UUID id);
}
