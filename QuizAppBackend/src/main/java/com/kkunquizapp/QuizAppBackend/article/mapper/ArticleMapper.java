package com.kkunquizapp.QuizAppBackend.article.mapper;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.dto.TagDto;
import com.kkunquizapp.QuizAppBackend.article.model.Article;
import com.kkunquizapp.QuizAppBackend.article.model.Tag;
import com.kkunquizapp.QuizAppBackend.user.dto.UserSummaryDto;
import com.kkunquizapp.QuizAppBackend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ArticleMapper {

    private final UserService userService;

    public ArticleDto toDto(Article a) {
        ArticleDto dto = new ArticleDto();

        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setSlug(a.getSlug());
        dto.setContentMarkdown(a.getContentMarkdown());
        dto.setContentHtml(a.getContentHtml());
        dto.setThumbnailUrl(a.getThumbnailUrl());
        dto.setDifficulty(a.getDifficulty());
        dto.setPublished(a.isPublished());
        dto.setReadingTime(a.getReadingTime());
        dto.setViews(a.getViews());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        // 🧩 Map Author (nếu có authorId)
        if (a.getAuthorId() != null) {
            try {
                UserSummaryDto author = userService.getPublicById(a.getAuthorId());
                dto.setAuthorId(author.getUserId());
                dto.setAuthorName(author.getName());
                dto.setAuthorAvatar(author.getAvatar());
            } catch (Exception e) {
                // Trong trường hợp user bị xóa hoặc lỗi, tránh crash toàn hệ thống
                dto.setAuthorId(a.getAuthorId());
                dto.setAuthorName("Unknown Author");
                dto.setAuthorAvatar(null);
            }
        }

        // 🏷️ Category
        if (a.getArticleCategory() != null) {
            ArticleCategoryDto cat = new ArticleCategoryDto();
            cat.setId(a.getArticleCategory().getId());
            cat.setName(a.getArticleCategory().getName());
            cat.setDescription(a.getArticleCategory().getDescription());
            cat.setActive(a.getArticleCategory().isActive());
            dto.setCategory(cat);
        }

        // 🏷️ Tags
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
