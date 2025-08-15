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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

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
        log.info("Creating post for userId: {}, requestDTO: {}", userId, requestDTO);
        validatePostRequest(userId, requestDTO, mediaFiles);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", userId);
                    return new IllegalArgumentException("User not found with ID: " + userId);
                });

        Post post = buildPost(user, requestDTO);
        log.info("Saving post: {}", post);
        post = postRepository.save(post);

        List<MediaDTO> mediaDTOs = requestDTO.getMedia() != null ? requestDTO.getMedia() : List.of();
        List<String> uploadedPublicIds = new ArrayList<>();

        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            try {
                log.info("Saving media for postId: {}", post.getPostId());
                savePostMedia(post, user, mediaDTOs, mediaFiles, uploadedPublicIds);
            } catch (IOException e) {
                log.error("Failed to upload media for postId: {}", post.getPostId(), e);
                cleanupCloudinaryFiles(uploadedPublicIds);
                throw new RuntimeException("Failed to upload media: " + e.getMessage(), e);
            } catch (Exception e) {
                log.error("Unexpected error during media upload for postId: {}", post.getPostId(), e);
                cleanupCloudinaryFiles(uploadedPublicIds);
                throw new RuntimeException("Unexpected error during media upload: " + e.getMessage(), e);
            }
        }

        PostDTO postDTO = mapToPostDTO(post, userId, null);
        log.info("Mapped Post to PostDTO: {}", postDTO);
        broadcastPost(post, userId, postDTO);

        if (requestDTO.getReplyToPostId() != null) {
            log.info("Creating reply notification for replyToPostId: {}", requestDTO.getReplyToPostId());
            createReplyNotification(post);
        }

        log.info("Post created successfully with ID: {}", post.getPostId());
        return postDTO;
    }

    @Transactional
    @Override
    public void likePost(UUID userId, UUID postId, ReactionType type) {
        log.info("Processing like for userId: {}, postId: {}, reactionType: {}", userId, postId, type);
        if (userId == null || postId == null) {
            log.error("User ID or post ID is null: userId={}, postId={}", userId, postId);
            throw new IllegalArgumentException("User ID and post ID cannot be null");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> {
                    log.error("Post not found with ID: {}", postId);
                    return new IllegalArgumentException("Post not found with ID: " + postId);
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", userId);
                    return new IllegalArgumentException("User not found with ID: " + userId);
                });

        log.info("Checking if user {} has already reacted to post {}", userId, postId);
        if (reactionRepository.existsByUserAndTargetIdAndTargetType(user, postId, ReactionTargetType.POST)) {
            log.info("User {} has already reacted, removing existing reaction", userId);
            Reaction existingReaction = reactionRepository.findByUserAndTargetIdAndTargetType(user, postId, ReactionTargetType.POST)
                    .orElseThrow(() -> {
                        log.error("Reaction not found despite existence check for userId: {}, postId: {}", userId, postId);
                        return new IllegalStateException("Reaction not found despite existence check");
                    });
            reactionRepository.delete(existingReaction);
            post.setLikeCount(post.getLikeCount() - 1);
            postRepository.save(post);
            log.info("Unliked postId: {}, new likeCount: {}", postId, post.getLikeCount());

            log.info("Creating unlike notification for post owner: {}, from user: {}", post.getUser().getUserId(), userId);
            notificationService.createNotification(
                    post.getUser().getUserId(),
                    userId,
                    "UNLIKED",
                    "POST",
                    postId,
                    com.kkunquizapp.QuizAppBackend.utils.StringUtils.abbreviate(post.getContent(), 60)
            );

            log.info("User {} unliked post {}", userId, postId);
        } else if (type != null) {
            log.info("User {} has not reacted, creating new reaction with type: {}", userId, type);
            Reaction reaction = Reaction.builder()
                    .user(user)
                    .targetType(ReactionTargetType.POST)
                    .targetId(postId)
                    .type(type)
                    .build();
            reactionRepository.save(reaction);

            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
            log.info("Liked postId: {}, new likeCount: {}", postId, post.getLikeCount());

            log.info("Creating like notification for post owner: {}, from user: {}", post.getUser().getUserId(), userId);
            notificationService.createNotification(
                    post.getUser().getUserId(),
                    userId,
                    "LIKED",
                    "POST",
                    postId,
                    com.kkunquizapp.QuizAppBackend.utils.StringUtils.abbreviate(post.getContent(), 60)
            );

            log.info("User {} liked post {} with reaction type {}", userId, postId, type);
        } else {
            log.error("Reaction type is null for like action on postId: {}", postId);
            throw new IllegalArgumentException("Reaction type cannot be null when liking a post");
        }

        PostDTO postDTO = mapToPostDTO(post, userId, user);
        log.info("Broadcasting post update to /topic/posts/{}: {}", postId, postDTO);
        messagingTemplate.convertAndSend("/topic/posts/" + postId, postDTO);
    }

    @Transactional
    @Override
    public void unlikePost(UUID userId, UUID postId) {
        log.info("Processing unlike for userId: {}, postId: {}", userId, postId);
        if (userId == null || postId == null) {
            log.error("User ID or post ID is null: userId={}, postId={}", userId, postId);
            throw new IllegalArgumentException("User ID and post ID cannot be null");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> {
                    log.error("Post not found with ID: {}", postId);
                    return new IllegalArgumentException("Post not found with ID: " + postId);
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", userId);
                    return new IllegalArgumentException("User not found with ID: " + userId);
                });

        log.info("Checking if user {} has reacted to post {}", userId, postId);
        if (reactionRepository.existsByUserAndTargetIdAndTargetType(user, postId, ReactionTargetType.POST)) {
            Reaction existingReaction = reactionRepository.findByUserAndTargetIdAndTargetType(user, postId, ReactionTargetType.POST)
                    .orElseThrow(() -> {
                        log.error("Reaction not found despite existence check for userId: {}, postId: {}", userId, postId);
                        return new IllegalStateException("Reaction not found despite existence check");
                    });
            reactionRepository.delete(existingReaction);
            post.setLikeCount(post.getLikeCount() - 1);
            postRepository.save(post);
            log.info("Unliked postId: {}, new likeCount: {}", postId, post.getLikeCount());

            log.info("Creating unlike notification for post owner: {}, from user: {}", post.getUser().getUserId(), userId);
            notificationService.createNotification(
                    post.getUser().getUserId(),
                    userId,
                    "UNLIKED",
                    "POST",
                    postId,
                    com.kkunquizapp.QuizAppBackend.utils.StringUtils.abbreviate(post.getContent(), 60)
            );

            log.info("User {} unliked post {}", userId, postId);

            PostDTO postDTO = mapToPostDTO(post, userId, user);
            log.info("Broadcasting post update to /topic/posts/{}: {}", postId, postDTO);
            messagingTemplate.convertAndSend("/topic/posts/" + postId, postDTO);
        } else {
            log.warn("No reaction found to unlike for userId: {}, postId: {}", userId, postId);
        }
    }

    @Transactional
    @Override
    public void deleteMedia(UUID mediaId, UUID userId) {
        log.info("Deleting media with mediaId: {} for userId: {}", mediaId, userId);
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> {
                    log.error("Media not found with ID: {}", mediaId);
                    return new IllegalArgumentException("Media not found with ID: " + mediaId);
                });

        if (!media.getOwnerUser().getUserId().equals(userId)) {
            log.error("User {} does not have permission to delete media {}", userId, mediaId);
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
    public PostDTO getPostById(UUID postId, UUID currentUserId) {
        log.info("Fetching post with postId: {} for currentUserId: {}", postId, currentUserId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> {
                    log.error("Post not found with ID: {}", postId);
                    return new IllegalArgumentException("Post not found with ID: " + postId);
                });

        PostDTO postDTO = mapToPostDTO(post, currentUserId, null);
        log.info("Fetched PostDTO: {}", postDTO);
        return postDTO;
    }

    // ====================== CHUYỂN SANG PAGE ======================

    @Transactional(readOnly = true)
    @Override
    public Page<PostDTO> getUserPosts(UUID userId, UUID currentUserId, Pageable pageable) {
        log.info("Fetching posts for userId: {}, viewed by currentUserId: {}, {}", userId, currentUserId, pageable);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", userId);
                    return new IllegalArgumentException("User not found with ID: " + userId);
                });

        boolean isOwner = currentUserId != null && currentUserId.equals(userId);
        boolean isFriend = false;
        if (currentUserId != null && !isOwner) {
            isFriend = userRepository.existsFriendship(userId, currentUserId);
            log.debug("Friendship check: userId={} and currentUserId={} -> isFriend={}", userId, currentUserId, isFriend);
        }

        Page<Post> postPage;
        if (isOwner) {
            postPage = postRepository.findByUserUserId(userId, pageable);
        } else if (isFriend) {
            postPage = postRepository.findByUserUserIdAndPrivacyIn(
                    userId, List.of(PostPrivacy.PUBLIC, PostPrivacy.FRIENDS), pageable);
        } else {
            postPage = postRepository.findByUserUserIdAndPrivacy(userId, PostPrivacy.PUBLIC, pageable);
        }

        Page<PostDTO> dtoPage = postPage.map(post -> mapToPostDTO(post, currentUserId, null));
        log.info("Fetched {} posts (page {} of {}) for userId: {}",
                dtoPage.getNumberOfElements(), dtoPage.getNumber() + 1, dtoPage.getTotalPages(), userId);
        return dtoPage;
    }

    @Transactional(readOnly = true)
    @Override
    public Page<PostDTO> getPublicPosts(UUID currentUserId, Pageable pageable) {
        log.info("Fetching public posts for currentUserId: {}, pageable: {}", currentUserId, pageable);

        Page<Post> postPage = postRepository.findByPrivacy(PostPrivacy.PUBLIC, pageable);
        Page<PostDTO> dtoPage = postPage.map(post -> mapToPostDTO(post, currentUserId, null));

        log.info("Fetched {} public posts (page {} of {})",
                dtoPage.getNumberOfElements(), dtoPage.getNumber() + 1, dtoPage.getTotalPages());
        return dtoPage;
    }

    @Transactional(readOnly = true)
    @Override
    public Page<PostDTO> getFriendsPosts(UUID currentUserId, Pageable pageable) {
        log.info("Fetching friends' posts for currentUserId: {}, pageable: {}", currentUserId, pageable);

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", currentUserId);
                    return new IllegalArgumentException("User not found with ID: " + currentUserId);
                });

        List<UUID> friendIds = currentUser.getFriends().stream()
                .map(User::getUserId)
                .collect(Collectors.toList());

        if (friendIds.isEmpty()) {
            log.info("User {} has no friends, returning empty page", currentUserId);
            return Page.empty(pageable);
        }

        Page<Post> postPage = postRepository.findByUserUserIdInAndPrivacyIn(
                friendIds, List.of(PostPrivacy.PUBLIC, PostPrivacy.FRIENDS), pageable);

        Page<PostDTO> dtoPage = postPage.map(post -> mapToPostDTO(post, currentUserId, null));

        log.info("Fetched {} friends' posts for userId: {} (page {} of {})",
                dtoPage.getNumberOfElements(), currentUserId, dtoPage.getNumber() + 1, dtoPage.getTotalPages());
        return dtoPage;
    }

    // ====================== Helpers ======================

    private void validatePostRequest(UUID userId, PostRequestDTO requestDTO, List<MultipartFile> mediaFiles) {
        log.info("Validating post request for userId: {}", userId);
        if (userId == null) {
            log.error("User ID is null");
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (requestDTO == null) {
            log.error("Post request is null");
            throw new IllegalArgumentException("Post request cannot be null");
        }
        if (!StringUtils.hasText(requestDTO.getContent()) &&
                (mediaFiles == null || mediaFiles.isEmpty()) &&
                (requestDTO.getMedia() == null || requestDTO.getMedia().isEmpty())) {
            log.error("Post has no content or media");
            throw new IllegalArgumentException("Post must have either content or media");
        }
        if (mediaFiles != null && mediaFiles.size() > MAX_MEDIA_FILES) {
            log.error("Too many media files: {}, max allowed: {}", mediaFiles.size(), MAX_MEDIA_FILES);
            throw new IllegalArgumentException("Cannot upload more than " + MAX_MEDIA_FILES + " media files");
        }
        log.info("Post request validated successfully");
    }

    private Post buildPost(User user, PostRequestDTO requestDTO) {
        log.info("Building post for user: {}, content: {}", user.getUserId(), requestDTO.getContent());
        Post post = Post.builder()
                .user(user)
                .content(requestDTO.getContent())
                .privacy(requestDTO.getPrivacy() != null ? requestDTO.getPrivacy() : PostPrivacy.PUBLIC)
                .replyToPost(requestDTO.getReplyToPostId() != null ?
                        postRepository.findById(requestDTO.getReplyToPostId())
                                .orElseThrow(() -> {
                                    log.error("Reply-to post not found with ID: {}", requestDTO.getReplyToPostId());
                                    return new IllegalArgumentException("Reply-to post not found with ID: " + requestDTO.getReplyToPostId());
                                })
                        : null)
                .build();
        log.info("Post built: {}", post);
        return post;
    }

    private void savePostMedia(Post post, User user, List<MediaDTO> mediaDTOs, List<MultipartFile> mediaFiles, List<String> uploadedPublicIds) throws IOException {
        log.info("Saving media for postId: {}, number of files: {}", post.getPostId(), mediaFiles.size());
        if (mediaFiles.isEmpty()) {
            log.info("No media files to save");
            return;
        }

        if (mediaDTOs.size() != mediaFiles.size()) {
            log.error("Media files count ({}) does not match media DTOs count ({})", mediaFiles.size(), mediaDTOs.size());
            throw new IllegalArgumentException("Number of media files must match number of media DTOs");
        }

        for (int i = 0; i < mediaFiles.size(); i++) {
            MultipartFile file = mediaFiles.get(i);
            MediaDTO mediaDTO = mediaDTOs.get(i);

            log.info("Validating media file at index: {}", i);
            validateMediaFile(file);

            log.info("Uploading media file to Cloudinary: {}", file.getOriginalFilename());
            Map<String, Object> uploadResult = cloudinaryService.upload(file, CLOUDINARY_FOLDER);
            log.debug("Cloudinary upload result: {}", uploadResult);

            String publicId = (String) uploadResult.get("public_id");
            if (publicId == null) {
                log.error("Cloudinary upload failed: public_id is null");
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
                log.error("Cloudinary upload result missing required fields: url={}, mimeType={}, sizeBytes={}", url, mimeType, sizeBytes);
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
                log.info("Saving media entity: {}", media);
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
            log.info("Saving PostMedia: {}", postMedia);
            postMediaRepository.save(postMedia);
        }
    }

    private void validateMediaFile(MultipartFile file) {
        log.info("Validating media file: {}", file.getOriginalFilename());
        if (file == null || file.isEmpty()) {
            log.error("Media file is null or empty");
            throw new IllegalArgumentException("Media file cannot be null or empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            log.error("Invalid media file content type: {}", contentType);
            throw new IllegalArgumentException("Only image files are supported");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            log.error("Media file size exceeds 10MB: {}", file.getSize());
            throw new IllegalArgumentException("Media file size cannot exceed 10MB");
        }
        log.info("Media file validated successfully");
    }

    private void cleanupCloudinaryFiles(List<String> publicIds) {
        log.info("Cleaning up Cloudinary files: {}", publicIds);
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
        log.info("Broadcasting post to destination: {}, postDTO: {}", destination, postDTO);
        messagingTemplate.convertAndSend(destination, postDTO);
    }

    private void createReplyNotification(Post post) {
        Post replyTo = post.getReplyToPost();
        if (replyTo != null) {
            log.info("Creating reply notification for postId: {}, replyToPostId: {}", post.getPostId(), replyTo.getPostId());
            notificationService.createNotification(
                    replyTo.getUser().getUserId(),
                    post.getUser().getUserId(),
                    "COMMENTED",
                    "POST",
                    post.getPostId(),
                    com.kkunquizapp.QuizAppBackend.utils.StringUtils.abbreviate(post.getContent(), 60)
            );
        } else {
            log.info("No reply notification created, replyToPost is null");
        }
    }

    private PostDTO mapToPostDTO(Post post, UUID currentUserId, User actingUser) {
        log.info("Mapping Post to PostDTO for postId: {}, currentUserId: {}, actingUser: {}",
                post.getPostId(), currentUserId, actingUser != null ? actingUser.getUserId() : "null");

        List<PostMedia> postMediaList = postMediaRepository.findByPostPostId(post.getPostId());
        List<MediaDTO> mediaDTOs = postMediaList.stream()
                .map(pm -> {
                    Media media = pm.getMedia();
                    MediaDTO mediaDTO = MediaDTO.builder()
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
                    log.debug("Mapped PostMedia to MediaDTO: {}", mediaDTO);
                    return mediaDTO;
                })
                .collect(Collectors.toList());

        boolean isLikedByCurrentUser = currentUserId != null &&
                userRepository.findById(currentUserId)
                        .map(user -> {
                            boolean liked = reactionRepository.existsByUserAndTargetIdAndTargetType(user, post.getPostId(), ReactionTargetType.POST);
                            log.debug("isLikedByCurrentUser for userId: {}, postId: {}: {}", currentUserId, post.getPostId(), liked);
                            return liked;
                        })
                        .orElse(false);

        ReactionType currentUserReactionType = null;
        if (isLikedByCurrentUser) {
            currentUserReactionType = userRepository.findById(currentUserId)
                    .flatMap(user -> reactionRepository.findByUserAndTargetIdAndTargetType(user, post.getPostId(), ReactionTargetType.POST))
                    .map(Reaction::getType)
                    .orElse(null);
            log.debug("currentUserReactionType for userId: {}, postId: {}: {}", currentUserId, post.getPostId(), currentUserReactionType);
        }

        UserDTO actingUserDTO = actingUser != null ? mapToUserDTO(actingUser) : null;
        log.info("Mapped actingUser to UserDTO: {}", actingUserDTO);

        PostDTO postDTO = PostDTO.builder()
                .postId(post.getPostId())
                .user(mapToUserDTO(post.getUser()))
                .content(post.getContent())
                .privacy(post.getPrivacy())
                .replyToPostId(post.getReplyToPost() != null ? post.getReplyToPost().getPostId() : null)
                .likeCount((int) post.getLikeCount())
                .commentCount((int) post.getCommentCount())
                .shareCount((int) post.getShareCount())
                .createdAt(post.getCreatedAt().toString())
                .updatedAt(post.getUpdatedAt().toString())
                .media(mediaDTOs)
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .currentUserReactionType(currentUserReactionType != null ? currentUserReactionType.name() : null)
                .actingUser(actingUserDTO)
                .build();
        log.info("Final PostDTO: {}", postDTO);
        return postDTO;
    }

    private UserDTO mapToUserDTO(User user) {
        UserDTO userDTO = UserDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .name(user.getName())
                .avatar(user.getAvatar())
                .school(user.getSchool())
                .build();
        log.debug("Mapped User to UserDTO: {}", userDTO);
        return userDTO;
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
