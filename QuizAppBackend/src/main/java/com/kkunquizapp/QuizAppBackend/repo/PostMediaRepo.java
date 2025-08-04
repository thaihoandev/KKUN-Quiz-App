package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.PostMedia;
import com.kkunquizapp.QuizAppBackend.model.PostMediaId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostMediaRepo extends JpaRepository<PostMedia, PostMediaId> {
    List<PostMedia> findByPostPostId(UUID postId);
    void deleteByMediaMediaId(UUID mediaId);
}