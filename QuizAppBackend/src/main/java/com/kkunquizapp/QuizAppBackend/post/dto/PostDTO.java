package com.kkunquizapp.QuizAppBackend.post.dto;

import com.kkunquizapp.QuizAppBackend.fileUpload.dto.MediaDTO;
import com.kkunquizapp.QuizAppBackend.post.model.enums.PostPrivacy;
import com.kkunquizapp.QuizAppBackend.user.dto.UserDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PostDTO {
    private UUID postId;
    private UserDTO user;
    private String content;
    private PostPrivacy privacy;
    private UUID replyToPostId;
    private int likeCount;
    private int commentCount;
    private int shareCount;
    private String createdAt;
    private String updatedAt;
    private List<MediaDTO> media;
    private boolean isLikedByCurrentUser;
    private String currentUserReactionType;
    private UserDTO actingUser; // Added for the user who performed the action (e.g., liked/unliked)
}