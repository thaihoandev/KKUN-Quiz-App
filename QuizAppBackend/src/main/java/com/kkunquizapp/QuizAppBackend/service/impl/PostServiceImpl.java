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
import com.kkunquizapp.QuizAppBackend.repo.ReactionRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.CloudinaryService;
import com.kkunquizapp.QuizAppBackend.service.NotificationService;
import com.kkunquizapp.QuizAppBackend.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation for handling post-related operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {
    private final PostRepo postRepository;
    private final MediaRepo mediaRepository;
    private final PostMediaRepo postMediaRepository;
    private final UserRepo userRepository;
    private final ReactionRepo reactionRepository;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String CLOUDINARY_FOLDER = "quizapp/posts";
    private static final int MAX_MEDIA_FILES = 10;

    @Transactional
    @Override
    public PostDTO createPost(UUID userId, PostRequestDTO requestDTO, List<MultipartFile> mediaFiles) {
        validatePostRequest(userId, requestDTO, mediaFiles);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Post post = buildPost(user, requestDTO);
        post = postRepository.save(post);

        List<MediaDTO> mediaDTOs = requestDTO.getMedia() != null ? requestDTO.getMedia() : List.of();
        List<String> uploadedPublicIds = new ArrayList<>();

        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            try {
                savePostMedia(post, user, mediaDTOs, mediaFiles, uploadedPublicIds);
            } catch (IOException e) {
                cleanupCloudinaryFiles(uploadedPublicIds);
                throw new RuntimeException("Failed to upload media: " + e.getMessage(), e);
            } catch (Exception e) {
                cleanupCloudinaryFiles(uploadedPublicIds);
                log.error("Unexpected error during media upload: {}", e.getMessage(), e);
                throw new RuntimeException("Unexpected error during media upload: " + e.getMessage(), e);
            }
        }

        PostDTO postDTO = mapToPostDTO(post);
        broadcastPost(post, userId, postDTO);

        if (requestDTO.getReplyToPostId() != null) {
            createReplyNotification(post);
        }

        log.info("Post created successfully with ID: {}", post.getPostId());
        return postDTO;
    }

    @Transactional
    @Override
    public void likePost(UUID userId, UUID postId, ReactionType type) {
        validateReaction(userId, postId, type);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (reactionRepository.existsByUserAndTargetIdAndTargetType(user, postId, ReactionTargetType.POST)) {
            throw new IllegalStateException("User has already reacted to this post");
        }

        Reaction reaction = Reaction.builder()
                .user(user)
                .targetType(ReactionTargetType.POST)
                .targetId(postId)
                .type(type)
                .build();
        reactionRepository.save(reaction);

        post.setLikeCount(post.getLikeCount() + 1);
        postRepository.save(post);

        notificationService.createNotification(
                post.getUser().getUserId(),
                userId,
                "liked",
                "post",
                postId
        );

        PostDTO postDTO = mapToPostDTO(post);
        messagingTemplate.convertAndSend("/topic/posts/" + postId, postDTO);

        log.info("User {} liked post {} with reaction type {}", userId, postId, type);
    }

    @Transactional
    @Override
    public void deleteMedia(UUID mediaId, UUID userId) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new IllegalArgumentException("Media not found with ID: " + mediaId));

        if (!media.getOwnerUser().getUserId().equals(userId)) {
            throw new IllegalStateException("User does not have permission to delete this media");
        }

        if (StringUtils.hasText(media.getPublicId())) {
            try {
                cloudinaryService.destroy(media.getPublicId());
                log.info("Deleted Cloudinary file with public ID: {}", media.getPublicId());
            } catch (IOException e) {
                log.error("Failed to delete Cloudinary file with public ID: {}", media.getPublicId(), e);
                throw new RuntimeException("Failed to delete media from Cloudinary: " + e.getMessage(), e);
            }
        }

        postMediaRepository.deleteByMediaMediaId(mediaId);
        mediaRepository.delete(media);
        log.info("Deleted media with ID: {} from database", mediaId);
    }

    @Transactional(readOnly = true)
    @Override
    public List<PostDTO> getUserPosts(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        List<Post> posts = postRepository.findByUserUserId(userId);
        return posts.stream()
                .map(this::mapToPostDTO)
                .collect(Collectors.toList());
    }

    private void validatePostRequest(UUID userId, PostRequestDTO requestDTO, List<MultipartFile> mediaFiles) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (requestDTO == null) {
            throw new IllegalArgumentException("Post request cannot be null");
        }
        if (!StringUtils.hasText(requestDTO.getContent()) &&
                (mediaFiles == null || mediaFiles.isEmpty()) &&
                (requestDTO.getMedia() == null || requestDTO.getMedia().isEmpty())) {
            throw new IllegalArgumentException("Post must have either content or media");
        }
        if (mediaFiles != null && mediaFiles.size() > MAX_MEDIA_FILES) {
            throw new IllegalArgumentException("Cannot upload more than " + MAX_MEDIA_FILES + " media files");
        }
    }

    private void validateReaction(UUID userId, UUID postId, ReactionType type) {
        if (userId == null || postId == null || type == null) {
            throw new IllegalArgumentException("User ID, post ID, and reaction type cannot be null");
        }
    }

    private Post buildPost(User user, PostRequestDTO requestDTO) {
        return Post.builder()
                .user(user)
                .content(requestDTO.getContent())
                .privacy(requestDTO.getPrivacy() != null ? requestDTO.getPrivacy() : PostPrivacy.PUBLIC)
                .replyToPost(requestDTO.getReplyToPostId() != null ?
                        postRepository.findById(requestDTO.getReplyToPostId())
                                .orElseThrow(() -> new IllegalArgumentException("Reply-to post not found with ID: " + requestDTO.getReplyToPostId()))
                        : null)
                .build();
    }

    private void savePostMedia(Post post, User user, List<MediaDTO> mediaDTOs, List<MultipartFile> mediaFiles, List<String> uploadedPublicIds) throws IOException {
        if (mediaFiles.isEmpty()) {
            return;
        }

        if (mediaDTOs.size() != mediaFiles.size()) {
            throw new IllegalArgumentException("Number of media files must match number of media DTOs");
        }

        for (int i = 0; i < mediaFiles.size(); i++) {
            MultipartFile file = mediaFiles.get(i);
            MediaDTO mediaDTO = mediaDTOs.get(i);

            validateMediaFile(file);

            Map<String, Object> uploadResult = cloudinaryService.upload(file, CLOUDINARY_FOLDER);
            log.debug("Cloudinary upload result: {}", uploadResult);

            String publicId = (String) uploadResult.get("public_id");
            if (publicId == null) {
                throw new IllegalStateException("Cloudinary upload failed: public_id is null");
            }
            uploadedPublicIds.add(publicId);

            String url = (String) uploadResult.get("secure_url");
            String thumbnailUrl = (String) uploadResult.get("thumbnail_url");
            String mimeType = (String) uploadResult.get("format");

            Integer width = toInt(uploadResult.get("width"));
            Integer height = toInt(uploadResult.get("height"));
            Long sizeBytes = toLong(uploadResult.get("bytes"));

            if (url == null || mimeType == null || sizeBytes == null) {
                throw new IllegalStateException("Cloudinary upload result missing required fields: url=" + url + ", mimeType=" + mimeType + ", sizeBytes=" + sizeBytes);
            }

            Media media = Media.builder()
                    .ownerUser(user)
                    .url(url)
                    .publicId(publicId)
                    .thumbnailUrl(thumbnailUrl)
                    .mimeType(mimeType)
                    .width(width)
                    .height(height)
                    .sizeBytes(sizeBytes)
                    .build();

            try {
                media = mediaRepository.save(media);
            } catch (Exception e) {
                log.error("Failed to save Media entity: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to save media entity: " + e.getMessage(), e);
            }

            PostMedia postMedia = PostMedia.builder()
                    .post(post)
                    .media(media)
                    .position(i)
                    .caption(mediaDTO.getCaption())
                    .isCover(mediaDTO.isCover())
                    .build();
            postMediaRepository.save(postMedia);
        }
    }


    private void validateMediaFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Media file cannot be null or empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are supported");
        }
        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new IllegalArgumentException("Media file size cannot exceed 10MB");
        }
    }

    private void cleanupCloudinaryFiles(List<String> publicIds) {
        for (String publicId : publicIds) {
            try {
                cloudinaryService.destroy(publicId);
                log.info("Deleted Cloudinary file with public ID: {}", publicId);
            } catch (IOException e) {
                log.error("Failed to delete Cloudinary file with public ID: {}", publicId, e);
            }
        }
    }

    private void broadcastPost(Post post, UUID userId, PostDTO postDTO) {
        String destination = post.getPrivacy() == PostPrivacy.PUBLIC ?
                "/topic/posts" :
                "/topic/posts/user/" + userId;
        messagingTemplate.convertAndSend(destination, postDTO);
    }

    private void createReplyNotification(Post post) {
        Post replyTo = post.getReplyToPost();
        if (replyTo != null) {
            notificationService.createNotification(
                    replyTo.getUser().getUserId(),
                    post.getUser().getUserId(),
                    "commented",
                    "post",
                    post.getPostId()
            );
        }
    }

    private PostDTO mapToPostDTO(Post post) {
        List<PostMedia> postMediaList = postMediaRepository.findByPostPostId(post.getPostId());
        List<MediaDTO> mediaDTOs = postMediaList.stream()
                .map(pm -> {
                    Media media = pm.getMedia();
                    return MediaDTO.builder()
                            .mediaId(media.getMediaId())
                            .url(media.getUrl())
                            .thumbnailUrl(media.getThumbnailUrl())
                            .mimeType(media.getMimeType())
                            .width(media.getWidth())
                            .height(media.getHeight())
                            .sizeBytes(media.getSizeBytes())
                            .caption(pm.getCaption())
                            .isCover(pm.isCover())
                            .build();
                })
                .collect(Collectors.toList());

        return PostDTO.builder()
                .postId(post.getPostId())
                .user(mapToUserDTO(post.getUser()))
                .content(post.getContent())
                .privacy(post.getPrivacy())
                .replyToPostId(post.getReplyToPost() != null ? post.getReplyToPost().getPostId() : null)
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .media(mediaDTOs)
                .build();
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

    private static Long toLong(Object o) {
        if (o instanceof Number) return ((Number) o).longValue();
        if (o instanceof String) {
            try { return Long.parseLong((String) o); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private static Integer toInt(Object o) {
        if (o instanceof Number) return ((Number) o).intValue();
        if (o instanceof String) {
            try { return Integer.parseInt((String) o); } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}