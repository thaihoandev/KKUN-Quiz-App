package com.kkunquizapp.QuizAppBackend.article.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SeriesSummaryDto {
    private UUID id;
    private String title;
    private String slug;
    private String description;
    private String thumbnailUrl;
}
