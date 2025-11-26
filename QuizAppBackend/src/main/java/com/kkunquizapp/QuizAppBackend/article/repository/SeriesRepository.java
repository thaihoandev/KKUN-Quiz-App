package com.kkunquizapp.QuizAppBackend.article.repository;

import com.kkunquizapp.QuizAppBackend.article.model.Series;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface SeriesRepository extends JpaRepository<Series, UUID> {

    Optional<Series> findBySlug(String slug);
    Page<Series> findByAuthorId(UUID authorId, Pageable pageable);
    Page<Series> findAll(Pageable pageable);

    @Query("""
        SELECT s FROM Series s
        LEFT JOIN FETCH s.articles as link
        LEFT JOIN FETCH link.article a
        LEFT JOIN FETCH a.articleCategory
        LEFT JOIN FETCH a.tags
        WHERE s.slug = :slug
    """)
    Optional<Series> findBySlugWithRelations(@Param("slug") String slug);
}
