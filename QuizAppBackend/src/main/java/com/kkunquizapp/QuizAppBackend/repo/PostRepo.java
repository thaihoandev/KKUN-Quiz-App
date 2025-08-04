package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostRepo extends JpaRepository<Post, UUID> {
    List<Post> findByUserUserId(UUID userId); // if you still want the non-paginated version

    Page<Post> findByUserUserId(UUID userId, Pageable pageable);
}