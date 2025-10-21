package com.kkunquizapp.QuizAppBackend.post.repository;

import com.kkunquizapp.QuizAppBackend.post.model.Post;
import com.kkunquizapp.QuizAppBackend.post.model.enums.PostPrivacy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostRepo extends JpaRepository<Post, UUID> {

    // used in getUserPosts() when you’re the owner
    Page<Post> findByUserUserId(UUID userId, Pageable pageable);

    // used in getUserPosts() when you’re a friend
    Page<Post> findByUserUserIdAndPrivacyIn(UUID userId, List<PostPrivacy> privacies, Pageable pageable);

    // used in getUserPosts() for strangers
    Page<Post> findByUserUserIdAndPrivacy(UUID userId, PostPrivacy privacy, Pageable pageable);

    // ← add this one for getPublicPosts()
    Page<Post> findByPrivacy(PostPrivacy privacy, Pageable pageable);

    // ← add this one for getFriendsPosts()
    Page<Post> findByUserUserIdInAndPrivacyIn(List<UUID> userIds, List<PostPrivacy> privacies, Pageable pageable);
}
