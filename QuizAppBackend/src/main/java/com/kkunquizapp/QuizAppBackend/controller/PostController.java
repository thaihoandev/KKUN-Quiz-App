package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.PostDTO;
import com.kkunquizapp.QuizAppBackend.dto.PostRequestDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionType;
import com.kkunquizapp.QuizAppBackend.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
    public ResponseEntity<PostDTO> createPost(@RequestBody PostRequestDTO dto, Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName()); // Assume userId in principal
        PostDTO postDTO = postService.createPost(userId, dto);
        return ResponseEntity.ok(postDTO);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> likePost(@PathVariable UUID postId, @RequestBody ReactionType type, Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        postService.likePost(userId, postId, type);
        return ResponseEntity.ok().build();
    }
}