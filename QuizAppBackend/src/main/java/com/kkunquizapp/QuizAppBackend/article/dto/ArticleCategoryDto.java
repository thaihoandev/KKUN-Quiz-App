package com.kkunquizapp.QuizAppBackend.article.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ArticleCategoryDto {
    private UUID id;
    private String name;
    private String description;
    private boolean active;
}
