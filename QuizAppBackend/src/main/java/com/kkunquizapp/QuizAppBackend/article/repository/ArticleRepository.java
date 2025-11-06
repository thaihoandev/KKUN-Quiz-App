package com.kkunquizapp.QuizAppBackend.article.repository;

import com.kkunquizapp.QuizAppBackend.article.model.Article;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArticleRepository extends JpaRepository<Article, UUID> {

    Page<Article> findByPublishedTrue(Pageable pageable);

    Page<Article> findByArticleCategoryAndPublishedTrue(ArticleCategory category, Pageable pageable);

    Optional<Article> findBySlug(String slug);

    @Query("""
    SELECT a FROM Article a
    WHERE a.authorId = :authorId
      AND a.id NOT IN (SELECT asr.articleId FROM ArticleSeries asr)
    """)
    Page<Article> findUnassignedByAuthorId(@Param("authorId") UUID authorId, Pageable pageable);

}

