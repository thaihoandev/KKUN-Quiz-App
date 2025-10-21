package com.kkunquizapp.QuizAppBackend.article.mapper;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.model.Article;
import org.springframework.stereotype.Component;

import com.kkunquizapp.QuizAppBackend.article.dto.TagDto;
import com.kkunquizapp.QuizAppBackend.article.model.Tag;

import java.util.Set;
import java.util.stream.Collectors;

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

        // Category
        if (a.getArticleCategory() != null) {
            ArticleCategoryDto cat = new ArticleCategoryDto();
            cat.setId(a.getArticleCategory().getId());
            cat.setName(a.getArticleCategory().getName());
            cat.setDescription(a.getArticleCategory().getDescription());
            cat.setActive(a.getArticleCategory().isActive());
            dto.setCategory(cat);
        }

        // 👇 Map tags
        if (a.getTags() != null && !a.getTags().isEmpty()) {
            Set<TagDto> tags = a.getTags().stream()
                    .map(this::toTagDto)
                    .collect(Collectors.toSet());
            dto.setTags(tags);
        }

        return dto;
    }

    private TagDto toTagDto(Tag t) {
        TagDto dto = new TagDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        return dto;
    }
}

