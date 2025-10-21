package com.kkunquizapp.QuizAppBackend.comment.controller;

import com.kkunquizapp.QuizAppBackend.comment.dto.CommentDTO;
import com.kkunquizapp.QuizAppBackend.comment.dto.CommentRequestDTO;
import com.kkunquizapp.QuizAppBackend.auth.service.AuthService;
import com.kkunquizapp.QuizAppBackend.comment.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;
    @Autowired
    private AuthService authService;

    @PostMapping("/create")
    public ResponseEntity<CommentDTO> createComment(@RequestBody CommentRequestDTO dto, Authentication authentication) {
        String userIdStr = authService.getCurrentUserId();
        UUID userId = UUID.fromString(userIdStr);
        CommentDTO commentDTO = commentService.createComment(userId, dto);
        return ResponseEntity.ok(commentDTO);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByPostId(@PathVariable UUID postId) {
        List<CommentDTO> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(comments);
    }
}