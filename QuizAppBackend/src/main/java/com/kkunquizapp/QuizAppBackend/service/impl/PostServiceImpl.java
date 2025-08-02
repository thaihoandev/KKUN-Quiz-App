package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.MediaDTO;
import com.kkunquizapp.QuizAppBackend.dto.PostDTO;
import com.kkunquizapp.QuizAppBackend.dto.PostRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserDTO;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.model.enums.PostPrivacy;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionTargetType;
import com.kkunquizapp.QuizAppBackend.model.enums.ReactionType;
import com.kkunquizapp.QuizAppBackend.repo.MediaRepo;
import com.kkunquizapp.QuizAppBackend.repo.PostMediaRepo;
import com.kkunquizapp.QuizAppBackend.repo.PostRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.NotificationService;
import com.kkunquizapp.QuizAppBackend.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {
    @Autowired
    private PostRepo postRepository;

    @Autowired
    private MediaRepo mediaRepository;

    @Autowired
    private PostMediaRepo postMediaRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public PostDTO createPost(UUID userId, PostRequestDTO requestDTO) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        Post post = new Post();
        post.setUser(user);
        post.setContent(requestDTO.getContent());
        post.setPrivacy(requestDTO.getPrivacy() != null ? requestDTO.getPrivacy() : PostPrivacy.PUBLIC);
        if (requestDTO.getReplyToPostId() != null) {
            Post replyTo = postRepository.findById(requestDTO.getReplyToPostId())
                    .orElseThrow(() -> new RuntimeException("Reply-to post not found"));
            post.setReplyToPost(replyTo);
        }
        post = postRepository.save(post);

        List<MediaDTO> mediaDTOs = requestDTO.getMedia() != null ? requestDTO.getMedia() : List.of();
        for (int i = 0; i < mediaDTOs.size(); i++) {
            MediaDTO mediaDTO = mediaDTOs.get(i);
            Media media = new Media();
            media.setOwnerUser(user);
            media.setUrl(mediaDTO.getUrl());
            media.setThumbnailUrl(mediaDTO.getThumbnailUrl());
            media.setMimeType(mediaDTO.getMimeType());
            media.setWidth(mediaDTO.getWidth());
            media.setHeight(mediaDTO.getHeight());
            media.setSizeBytes(mediaDTO.getSizeBytes());
            media = mediaRepository.save(media);

            PostMedia postMedia = new PostMedia();
            postMedia.setPost(post);
            postMedia.setMedia(media);
            postMedia.setPosition(i);
            postMedia.setCaption(mediaDTO.getCaption());
            postMedia.setCover(mediaDTO.isCover());
            postMediaRepository.save(postMedia);
        }

        PostDTO postDTO = mapToPostDTO(post);

        // Send real-time update to subscribers
        if (post.getPrivacy() == PostPrivacy.PUBLIC) {
            messagingTemplate.convertAndSend("/topic/posts", postDTO);
        } else if (post.getPrivacy() == PostPrivacy.FRIENDS) {
            // TODO: Implement friend-based broadcasting (requires friend relationship logic)
            // For now, send to user-specific topic
            messagingTemplate.convertAndSend("/topic/posts/user/" + userId, postDTO);
        }

        if (requestDTO.getReplyToPostId() != null) {
            Post replyTo = post.getReplyToPost();
            notificationService.createNotification(
                    replyTo.getUser().getUserId(),
                    userId,
                    "commented",
                    "post",
                    post.getPostId()
            );
        }

        return postDTO;
    }

    @Transactional
    public void likePost(UUID userId, UUID postId, ReactionType type) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Implement reaction logic (e.g., create/update Reaction entity)
        Reaction reaction = new Reaction();
        reaction.setUser(userRepository.findById(userId).orElseThrow());
        reaction.setTargetType(ReactionTargetType.POST);
        reaction.setTargetId(postId);
        reaction.setType(type);
        // Save reaction (assumes ReactionRepository exists)
        // Update post.likeCount
        post.setLikeCount(post.getLikeCount() + 1);
        postRepository.save(post);

        notificationService.createNotification(
                post.getUser().getUserId(),
                userId,
                "liked",
                "post",
                postId
        );

        // Send real-time update
        PostDTO postDTO = mapToPostDTO(post);
        messagingTemplate.convertAndSend("/topic/posts/" + postId, postDTO);
    }

    private PostDTO mapToPostDTO(Post post) {
        PostDTO postDTO = new PostDTO();
        postDTO.setPostId(post.getPostId());
        postDTO.setUser(mapToUserDTO(post.getUser()));
        postDTO.setContent(post.getContent());
        postDTO.setPrivacy(post.getPrivacy());
        postDTO.setReplyToPostId(post.getReplyToPost() != null ? post.getReplyToPost().getPostId() : null);
        postDTO.setLikeCount(post.getLikeCount());
        postDTO.setCommentCount(post.getCommentCount());
        postDTO.setShareCount(post.getShareCount());
        postDTO.setCreatedAt(post.getCreatedAt());
        postDTO.setUpdatedAt(post.getUpdatedAt());

        List<PostMedia> postMediaList = postMediaRepository.findAll().stream()
                .filter(pm -> pm.getPost().getPostId().equals(post.getPostId()))
                .toList();
        List<MediaDTO> mediaDTOs = postMediaList.stream()
                .map(pm -> {
                    Media media = pm.getMedia();
                    MediaDTO mediaDTO = new MediaDTO();
                    mediaDTO.setMediaId(media.getMediaId());
                    mediaDTO.setUrl(media.getUrl());
                    mediaDTO.setThumbnailUrl(media.getThumbnailUrl());
                    mediaDTO.setMimeType(media.getMimeType());
                    mediaDTO.setWidth(media.getWidth());
                    mediaDTO.setHeight(media.getHeight());
                    mediaDTO.setSizeBytes(media.getSizeBytes());
                    mediaDTO.setCaption(pm.getCaption());
                    mediaDTO.setCover(pm.isCover());
                    return mediaDTO;
                })
                .collect(Collectors.toList());
        postDTO.setMedia(mediaDTOs);

        return postDTO;
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
