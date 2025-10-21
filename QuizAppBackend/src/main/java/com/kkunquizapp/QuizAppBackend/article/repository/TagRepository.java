package com.kkunquizapp.QuizAppBackend.article.repository;


import com.kkunquizapp.QuizAppBackend.article.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface TagRepository extends JpaRepository<Tag, UUID> {

    Optional<Tag> findByNameIgnoreCase(String name);

    Page<Tag> findAll(Pageable pageable);
}