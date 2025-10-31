package com.kkunquizapp.QuizAppBackend.article.dto;


import com.kkunquizapp.QuizAppBackend.article.model.enums.ArticleDifficulty;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
public class ArticleDto {
    private UUID id;
    private String title;
    private String slug;
    private String contentMarkdown;
    private String contentHtml;
    private String thumbnailUrl;
    private ArticleCategoryDto category;     // 👈 trả về object category
    private ArticleDifficulty difficulty;
    private UUID authorId;
    private String authorName;
    private String authorAvatar;
    private boolean published;
    private Set<TagDto> tags;
    private int readingTime;
    private long views;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

