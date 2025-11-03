package com.kkunquizapp.QuizAppBackend.article.repository;

import com.kkunquizapp.QuizAppBackend.article.model.Series;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface SeriesRepository extends JpaRepository<Series, UUID> {

    Optional<Series> findBySlug(String slug);
    Page<Series> findByAuthorId(UUID authorId, Pageable pageable);
    Page<Series> findAll(Pageable pageable);
}
