package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponseDTO register(UserRequestDTO userRequestDTO);

    AuthResponseDTO verify(UserRequestDTO userRequestDTO);

    AuthResponseDTO createOrUpdateOAuth2User(String email, String name);
    List<UserResponseDTO> getAllUsers();

    UserResponseDTO getUserById(UUID id);


    UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO);

    void deleteUser(UUID id);
}
