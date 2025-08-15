package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.PostDTO;
import com.kkunquizapp.QuizAppBackend.dto.PostRequestDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PostService {
    PostDTO createPost(UUID userId, PostRequestDTO requestDTO, List<MultipartFile> mediaFiles);

    void likePost(UUID userId, UUID postId, ReactionType type);

    void unlikePost(UUID userId, UUID postId);

    void deleteMedia(UUID mediaId, UUID userId);

    PostDTO getPostById(UUID postId, UUID currentUserId);

    // ⬇️ đổi từ List -> Page + dùng Pageable
    Page<PostDTO> getUserPosts(UUID userId, UUID currentUserId, Pageable pageable);

    Page<PostDTO> getPublicPosts(UUID currentUserId, Pageable pageable);

    Page<PostDTO> getFriendsPosts(UUID currentUserId, Pageable pageable);
}
