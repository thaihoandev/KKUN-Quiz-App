package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.CommentDTO;
import com.kkunquizapp.QuizAppBackend.dto.CommentRequestDTO;

import java.util.List;
import java.util.UUID;

public interface CommentService {
    CommentDTO createComment(UUID userId, CommentRequestDTO requestDTO);
    List<CommentDTO> getCommentsByPostId(UUID postId);
}
