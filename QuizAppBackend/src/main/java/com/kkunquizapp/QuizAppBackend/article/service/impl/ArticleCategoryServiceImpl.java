package com.kkunquizapp.QuizAppBackend.article.service.impl;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import com.kkunquizapp.QuizAppBackend.article.repository.ArticleCategoryRepository;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleCategoryServiceImpl implements ArticleCategoryService {

    private final ArticleCategoryRepository repository;

    @Override
    public List<ArticleCategoryDto> getAllActive() {
        return repository.findAll().stream()
                .filter(ArticleCategory::isActive)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ArticleCategoryDto create(String name, String description) {
        ArticleCategory category = new ArticleCategory();
        category.setName(name);
        category.setDescription(description);
        repository.save(category);
        return toDto(category);
    }

    @Override
    public ArticleCategory getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    private ArticleCategoryDto toDto(ArticleCategory c) {
        ArticleCategoryDto dto = new ArticleCategoryDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setActive(c.isActive());
        return dto;
    }
}
