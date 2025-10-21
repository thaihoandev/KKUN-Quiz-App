package com.kkunquizapp.QuizAppBackend.article.repository;

import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ArticleCategoryRepository extends JpaRepository<ArticleCategory, UUID> {

    Page<ArticleCategory> findByActiveTrue(Pageable pageable);
}
