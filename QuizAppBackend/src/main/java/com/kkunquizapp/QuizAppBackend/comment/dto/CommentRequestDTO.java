package com.kkunquizapp.QuizAppBackend.comment.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CommentRequestDTO {
    private UUID postId;
    private UUID parentCommentId;
    private String content;
}