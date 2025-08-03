package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.PostDTO;
import com.kkunquizapp.QuizAppBackend.dto.PostRequestDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PostService {
    PostDTO createPost(UUID userId, PostRequestDTO requestDTO, List<MultipartFile> mediaFiles);
    void likePost(UUID userId, UUID postId, ReactionType type);
    void deleteMedia(UUID mediaId, UUID userId);
    List<PostDTO> getUserPosts(UUID userId, int page, int size);
}
