package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.PostMedia;
import com.kkunquizapp.QuizAppBackend.model.PostMediaId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostMediaRepo extends JpaRepository<PostMedia, PostMediaId> {
}