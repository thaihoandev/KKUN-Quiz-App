package com.kkunquizapp.QuizAppBackend.article.dto;


import com.kkunquizapp.QuizAppBackend.article.model.enums.ArticleDifficulty;
import lombok.Data;
import java.time.LocalDateTime;
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
    private boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

