package com.kkunquizapp.QuizAppBackend.article.repository;

import com.kkunquizapp.QuizAppBackend.article.model.Article;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArticleRepository extends JpaRepository<Article, UUID> {
    Optional<Article> findBySlug(String slug);
    List<Article> findByArticleCategoryAndPublishedTrue(ArticleCategory category);
    List<Article> findByPublishedTrue();
}
