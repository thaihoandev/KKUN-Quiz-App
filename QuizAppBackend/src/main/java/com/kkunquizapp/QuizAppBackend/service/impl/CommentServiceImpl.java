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

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setPost(post);
        comment.setContent(requestDTO.getContent());

        if (requestDTO.getParentCommentId() != null) {
            Comment parentComment = commentRepository.findById(requestDTO.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
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
        if (!notificationTargetUserId.equals(userId)) { // Avoid self-notification
            notificationService.createNotification(
                    notificationTargetUserId,
                    userId,
                    "commented",
                    requestDTO.getParentCommentId() != null ? "comment" : "post",
                    requestDTO.getParentCommentId() != null ? comment.getCommentId() : post.getPostId()
            );
        }

        // Send real-time comment update
        CommentDTO commentDTO = mapToCommentDTO(comment);
        messagingTemplate.convertAndSend("/topic/posts/" + post.getPostId() + "/comments", commentDTO);

        return commentDTO;
    }

    public List<CommentDTO> getCommentsByPostId(UUID postId) {
        List<Comment> comments = commentRepository.findAll().stream()
                .filter(comment -> comment.getPost().getPostId().equals(postId) && comment.getDeletedAt() == null)
                .collect(Collectors.toList());
        return comments.stream()
                .map(this::mapToCommentDTO)
                .collect(Collectors.toList());
    }

    private CommentDTO mapToCommentDTO(Comment comment) {
        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setCommentId(comment.getCommentId());
        commentDTO.setPostId(comment.getPost().getPostId());
        commentDTO.setUser(mapToUserDTO(comment.getUser()));
        commentDTO.setParentCommentId(comment.getParentComment() != null ? comment.getParentComment().getCommentId() : null);
        commentDTO.setContent(comment.getContent());
        commentDTO.setLikeCount(comment.getLikeCount());
        commentDTO.setCreatedAt(comment.getCreatedAt());
        commentDTO.setUpdatedAt(comment.getUpdatedAt());
        return commentDTO;
    }

    private UserDTO mapToUserDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(user.getUserId());
        userDTO.setUsername(user.getUsername());
        userDTO.setName(user.getName());
        userDTO.setAvatar(user.getAvatar());
        userDTO.setSchool(user.getSchool());
        return userDTO;
    }
}