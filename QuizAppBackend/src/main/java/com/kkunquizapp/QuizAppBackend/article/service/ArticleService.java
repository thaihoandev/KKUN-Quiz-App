package com.kkunquizapp.QuizAppBackend.article.service;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCreateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;

import java.util.List;
import java.util.UUID;

public interface ArticleService {
    List<ArticleDto> getAllPublished();
    List<ArticleDto> getPublishedByCategory(UUID categoryId);
    ArticleDto getBySlug(String slug);
    ArticleDto create(ArticleCreateRequest req);
}
