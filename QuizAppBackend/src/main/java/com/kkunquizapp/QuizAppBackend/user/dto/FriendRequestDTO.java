package com.kkunquizapp.QuizAppBackend.user.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
public class FriendRequestDTO {
    private UUID id;
    private String status;          // PENDING / ACCEPTED / DECLINED / CANCELED
    private LocalDateTime createdAt;

    // requester
    private UUID requesterId;
    private String requesterName;
    private String requesterUsername;
    private String requesterAvatar;

    // receiver
    private UUID receiverId;
    private String receiverName;
    private String receiverUsername;
    private String receiverAvatar;
}
