package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CommentDTO {
    private UUID commentId;
    private UUID postId;
    private UserDTO user;
    private UUID parentCommentId;
    private String content;
    private long likeCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentDTO> replies;
}