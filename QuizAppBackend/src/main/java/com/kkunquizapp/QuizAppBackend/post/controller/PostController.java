package com.kkunquizapp.QuizAppBackend.post.controller;

import com.kkunquizapp.QuizAppBackend.post.dto.PostDTO;
import com.kkunquizapp.QuizAppBackend.post.dto.PostRequestDTO;
import com.kkunquizapp.QuizAppBackend.post.model.enums.ReactionType;
import com.kkunquizapp.QuizAppBackend.auth.service.AuthService;
import com.kkunquizapp.QuizAppBackend.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            UUID userId = UUID.fromString(authService.getCurrentUserId());
            return ResponseEntity.ok(postService.createPost(userId, dto, mediaFiles));
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
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            UUID userId = UUID.fromString(authService.getCurrentUserId());
            postService.likePost(userId, postId, type);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{postId}/unlike")
    public ResponseEntity<Void> unlikePost(@PathVariable UUID postId, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            UUID userId = UUID.fromString(authService.getCurrentUserId());
            postService.unlikePost(userId, postId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ====== User's posts -> Page ======
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<PostDTO>> getUserPosts(
            @PathVariable UUID userId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            UUID currentUserId = UUID.fromString(authService.getCurrentUserId());
            Page<PostDTO> posts = postService.getUserPosts(userId, currentUserId, pageable);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Page.empty(pageable));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ====== Public posts -> Page ======
    @GetMapping("/public")
    public ResponseEntity<Page<PostDTO>> getPublicPosts(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            Authentication authentication) {
        try {
            UUID currentUserId = null;
            if (authentication != null) {
                currentUserId = UUID.fromString(authService.getCurrentUserId());
            }
            Page<PostDTO> posts = postService.getPublicPosts(currentUserId, pageable);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Page.empty(pageable));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ====== Friends posts -> Page ======
    @GetMapping("/friends")
    public ResponseEntity<Page<PostDTO>> getFriendsPosts(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            UUID currentUserId = UUID.fromString(authService.getCurrentUserId());
            Page<PostDTO> posts = postService.getFriendsPosts(currentUserId, pageable);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Page.empty(pageable));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostDTO> getPostById(@PathVariable UUID postId, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        try {
            UUID userId = UUID.fromString(authService.getCurrentUserId());
            return ResponseEntity.ok(postService.getPostById(postId, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
