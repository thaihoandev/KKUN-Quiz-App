package com.kkunquizapp.QuizAppBackend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ParticipantDTO {
    private UUID userId;
    private String role;       // OWNER/MODERATOR/MEMBER
    private String nickname;
    private LocalDateTime joinedAt;
    private UserBriefDTO user;
}