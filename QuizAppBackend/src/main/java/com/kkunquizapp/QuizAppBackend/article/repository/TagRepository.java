package com.kkunquizapp.QuizAppBackend.article.repository;


import com.kkunquizapp.QuizAppBackend.article.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
}
