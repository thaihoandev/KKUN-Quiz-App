package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CommentRequestDTO {
    private UUID postId;
    private UUID parentCommentId;
    private String content;
}