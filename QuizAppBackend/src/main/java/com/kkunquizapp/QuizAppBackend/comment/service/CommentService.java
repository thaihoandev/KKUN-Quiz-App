package com.kkunquizapp.QuizAppBackend.comment.service;

import com.kkunquizapp.QuizAppBackend.comment.dto.CommentDTO;
import com.kkunquizapp.QuizAppBackend.comment.dto.CommentRequestDTO;

import java.util.List;
import java.util.UUID;

public interface CommentService {
    CommentDTO createComment(UUID userId, CommentRequestDTO requestDTO);
    List<CommentDTO> getCommentsByPostId(UUID postId);
}
