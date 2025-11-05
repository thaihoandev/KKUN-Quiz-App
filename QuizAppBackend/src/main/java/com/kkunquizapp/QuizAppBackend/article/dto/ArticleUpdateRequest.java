package com.kkunquizapp.QuizAppBackend.article.dto;

import com.kkunquizapp.QuizAppBackend.article.model.enums.ArticleDifficulty;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Data
public class ArticleUpdateRequest {
    private String title;
    private String contentMarkdown;
    private UUID categoryId;
    private UUID authorId;
    private List<String> tags;
    private MultipartFile thumbnail;
    private ArticleDifficulty difficulty;
    private UUID seriesId;
}
