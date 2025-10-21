package com.kkunquizapp.QuizAppBackend.article.service;


import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ArticleCategoryService {
    Page<ArticleCategoryDto> getAllActive(Pageable pageable);
    ArticleCategoryDto create(String name, String description);
    ArticleCategory getById(UUID id);
}
