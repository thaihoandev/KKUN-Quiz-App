package com.kkunquizapp.QuizAppBackend.dto;

import lombok.*;

import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MediaBriefDTO {
    private UUID mediaId;
    private String url;
    private String thumbnailUrl;
    private String mimeType;
    private Integer width;
    private Integer height;
    private Long sizeBytes;
}