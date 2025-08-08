package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.CommentDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserDTO;
import com.kkunquizapp.QuizAppBackend.dto.CommentRequestDTO;
import com.kkunquizapp.QuizAppBackend.model.Comment;
import com.kkunquizapp.QuizAppBackend.model.Post;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.repo.CommentRepo;
import com.kkunquizapp.QuizAppBackend.repo.PostRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommentServiceImpl implements CommentService {

    @Autowired
    private CommentRepo commentRepository;

    @Autowired
    private PostRepo postRepository;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public CommentDTO createComment(UUID userId, CommentRequestDTO requestDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(requestDTO.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.isLocked()) {
            throw new RuntimeException("Cannot comment on a locked post");
        }

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setPost(post);
        comment.setContent(requestDTO.getContent());

        if (requestDTO.getParentCommentId() != null) {
            Comment parentComment = commentRepository.findByIdAndDeletedAtIsNull(requestDTO.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found or has been deleted"));
            comment.setParentComment(parentComment);
        }

        comment = commentRepository.save(comment);

        // Update post comment count
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        // Create notification
        UUID notificationTargetUserId = post.getUser().getUserId();
        if (requestDTO.getParentCommentId() != null) {
            notificationTargetUserId = comment.getParentComment().getUser().getUserId();
        }
        try {
            if (!notificationTargetUserId.equals(userId)) {
                notificationService.createNotification(
                        notificationTargetUserId,
                        userId,
                        "commented",
                        requestDTO.getParentCommentId() != null ? "comment" : "post",
                        requestDTO.getParentCommentId() != null ? comment.getCommentId() : post.getPostId(),
                        requestDTO.getContent()
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        // Send real-time comment update
        CommentDTO commentDTO = mapToCommentDTO(comment, 2);
        messagingTemplate.convertAndSend("/topic/posts/" + post.getPostId() + "/comments", commentDTO);

        return commentDTO;
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByPostId(UUID postId) {
        List<Comment> comments = commentRepository.findByPostPostIdAndParentCommentCommentIdIsNullAndDeletedAtIsNull(postId);
        return comments.stream()
                .map(comment -> mapToCommentDTO(comment, 2))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found or already deleted"));
        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);

        // Update post comment count
        Post post = comment.getPost();
        post.setCommentCount(post.getCommentCount() - 1);
        postRepository.save(post);

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/posts/" + post.getPostId() + "/comments/deleted", commentId);
    }

    private CommentDTO mapToCommentDTO(Comment comment, int maxDepth) {
        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setCommentId(comment.getCommentId());
        commentDTO.setPostId(comment.getPost().getPostId());
        commentDTO.setUser(mapToUserDTO(comment.getUser()));
        commentDTO.setParentCommentId(comment.getParentComment() != null ? comment.getParentComment().getCommentId() : null);
        commentDTO.setContent(comment.getContent());
        commentDTO.setLikeCount(comment.getLikeCount());
        commentDTO.setCreatedAt(comment.getCreatedAt());
        commentDTO.setUpdatedAt(comment.getUpdatedAt());

        if (maxDepth > 0) {
            commentDTO.setReplies(
                    comment.getReplies().stream()
                            .filter(reply -> reply.getDeletedAt() == null)
                            .map(reply -> mapToCommentDTO(reply, maxDepth - 1))
                            .collect(Collectors.toList())
            );
        } else {
            commentDTO.setReplies(new ArrayList<>());
        }

        return commentDTO;
    }

    private UserDTO mapToUserDTO(User user) {
        return UserDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .name(user.getName())
                .avatar(user.getAvatar())
                .school(user.getSchool())
                .build();
    }
}