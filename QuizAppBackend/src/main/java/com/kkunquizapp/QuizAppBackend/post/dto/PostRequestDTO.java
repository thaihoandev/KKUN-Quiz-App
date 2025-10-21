package com.kkunquizapp.QuizAppBackend.post.dto;

import com.kkunquizapp.QuizAppBackend.fileUpload.dto.MediaDTO;
import com.kkunquizapp.QuizAppBackend.post.model.enums.PostPrivacy;
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