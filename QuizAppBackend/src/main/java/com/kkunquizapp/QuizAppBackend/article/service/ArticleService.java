package com.kkunquizapp.QuizAppBackend.article.service;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCreateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;

import java.util.UUID;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ArticleService {
    Page<ArticleDto> getAllPublished(Pageable pageable);
    Page<ArticleDto> getPublishedByCategory(UUID categoryId, Pageable pageable);
    ArticleDto getBySlug(String slug);
    ArticleDto create(ArticleCreateRequest req);
    ArticleDto update(String slug, ArticleUpdateRequest req);

    void delete(UUID id);
}
