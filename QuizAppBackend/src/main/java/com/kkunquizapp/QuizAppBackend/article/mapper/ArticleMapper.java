package com.kkunquizapp.QuizAppBackend.article.mapper;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.model.Article;
import org.springframework.stereotype.Component;

@Component
public class ArticleMapper {

    public ArticleDto toDto(Article a) {
        ArticleDto dto = new ArticleDto();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setSlug(a.getSlug());
        dto.setContentMarkdown(a.getContentMarkdown());
        dto.setContentHtml(a.getContentHtml());
        dto.setThumbnailUrl(a.getThumbnailUrl());
        dto.setDifficulty(a.getDifficulty());
        dto.setAuthorId(a.getAuthorId());
        dto.setPublished(a.isPublished());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        if (a.getArticleCategory() != null) {
            ArticleCategoryDto cat = new ArticleCategoryDto();
            cat.setId(a.getArticleCategory().getId());
            cat.setName(a.getArticleCategory().getName());
            cat.setDescription(a.getArticleCategory().getDescription());
            cat.setActive(a.getArticleCategory().isActive());
            dto.setCategory(cat);
        }

        return dto;
    }
}
