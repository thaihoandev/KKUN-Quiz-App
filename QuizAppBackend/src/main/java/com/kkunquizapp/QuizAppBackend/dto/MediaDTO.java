package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class MediaDTO {
    private UUID mediaId;
    private String url;
    private String thumbnailUrl;
    private String mimeType;
    private Integer width;
    private Integer height;
    private Long sizeBytes;
    private String caption;
    private boolean isCover;
}