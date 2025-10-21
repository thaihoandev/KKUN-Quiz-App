package com.kkunquizapp.QuizAppBackend.article.dto;


import com.kkunquizapp.QuizAppBackend.article.model.enums.ArticleDifficulty;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Data
public class ArticleCreateRequest {
    private String title;
    private String contentMarkdown;
    private String thumbnailUrl;
    private UUID categoryId;              // 👈 liên kết category bằng UUID
    private ArticleDifficulty difficulty;
    private UUID authorId;

    // 👇 Thêm thumbnail file
    private MultipartFile thumbnail;

    private List<String> tags;
}

