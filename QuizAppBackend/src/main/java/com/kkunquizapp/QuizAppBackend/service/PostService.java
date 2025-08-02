package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.PostDTO;
import com.kkunquizapp.QuizAppBackend.dto.PostRequestDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionType;

import java.util.UUID;

public interface PostService {
    PostDTO createPost(UUID userId, PostRequestDTO requestDTO);
    void likePost(UUID userId, UUID postId, ReactionType type);
}
