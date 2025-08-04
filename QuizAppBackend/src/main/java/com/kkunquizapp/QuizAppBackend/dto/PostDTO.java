package com.kkunquizapp.QuizAppBackend.dto;

import com.kkunquizapp.QuizAppBackend.model.enums.PostPrivacy;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
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
    private long likeCount;
    private long commentCount;
    private long shareCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<MediaDTO> media;
}