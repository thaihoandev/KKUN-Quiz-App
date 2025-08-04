package com.kkunquizapp.QuizAppBackend.dto;

import com.kkunquizapp.QuizAppBackend.model.enums.PostPrivacy;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class PostRequestDTO {
    private String content;
    private PostPrivacy privacy;
    private UUID replyToPostId;
    private List<MediaDTO> media;
}