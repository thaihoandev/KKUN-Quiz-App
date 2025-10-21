package com.kkunquizapp.QuizAppBackend.article.repository;

import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ArticleCategoryRepository extends JpaRepository<ArticleCategory, UUID> {
    Optional<ArticleCategory> findByNameIgnoreCase(String name);
}
