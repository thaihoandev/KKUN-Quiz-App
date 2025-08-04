package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.PostDTO;
import com.kkunquizapp.QuizAppBackend.dto.PostRequestDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionType;
import com.kkunquizapp.QuizAppBackend.service.AuthService;
import com.kkunquizapp.QuizAppBackend.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthService authService;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDTO> createPost(
            @RequestPart("post") @Valid PostRequestDTO dto,
            @RequestPart(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        try {
            String userIdStr = authService.getCurrentUserId();
            UUID userId = UUID.fromString(userIdStr);
            PostDTO postDTO = postService.createPost(userId, dto, mediaFiles);
            return ResponseEntity.ok(postDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> likePost(
            @PathVariable UUID postId,
            @RequestBody ReactionType type,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            String userIdStr = authService.getCurrentUserId();
            UUID userId = UUID.fromString(userIdStr);
            postService.likePost(userId, postId, type);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{postId}/unlike")
    public ResponseEntity<Void> unlikePost(
            @PathVariable UUID postId,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            String userIdStr = authService.getCurrentUserId();
            UUID userId = UUID.fromString(userIdStr);
            postService.unlikePost(userId, postId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostDTO>> getUserPosts(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            List<PostDTO> posts = postService.getUserPosts(userId, page, size);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostDTO> getPostById(
            @PathVariable UUID postId,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        try {
            String userIdStr = authService.getCurrentUserId();
            UUID userId = UUID.fromString(userIdStr);
            PostDTO postDTO = postService.getPostById(postId, userId);
            return ResponseEntity.ok(postDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}