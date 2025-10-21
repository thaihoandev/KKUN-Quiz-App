package com.kkunquizapp.QuizAppBackend.article.service;


import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;

import java.util.List;
import java.util.UUID;

public interface ArticleCategoryService {
    List<ArticleCategoryDto> getAllActive();
    ArticleCategoryDto create(String name, String description);
    ArticleCategory getById(UUID id);
}
