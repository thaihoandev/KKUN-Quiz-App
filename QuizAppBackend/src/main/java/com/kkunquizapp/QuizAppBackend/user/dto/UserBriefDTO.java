package com.kkunquizapp.QuizAppBackend.user.dto;

// chat/dto/UserBriefDTO.java
import lombok.*;

import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserBriefDTO {
    private UUID userId;
    private String name;
    private String username;
    private String avatar;
}
