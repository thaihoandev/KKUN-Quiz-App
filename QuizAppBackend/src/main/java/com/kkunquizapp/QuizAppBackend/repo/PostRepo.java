package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Post;
import com.kkunquizapp.QuizAppBackend.model.enums.PostPrivacy;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PostRepo extends JpaRepository<Post, UUID> {
    List<Post> findByUserUserId(UUID userId); // if you still want the non-paginated version

    Page<Post> findByUserUserId(UUID userId, Pageable pageable);

    Page<Post> findByUserUserIdAndPrivacyIn(UUID userId, List<PostPrivacy> privacies, Pageable pageable);
    Page<Post> findByUserUserIdAndPrivacy(UUID userId, PostPrivacy privacy, Pageable pageable);


}