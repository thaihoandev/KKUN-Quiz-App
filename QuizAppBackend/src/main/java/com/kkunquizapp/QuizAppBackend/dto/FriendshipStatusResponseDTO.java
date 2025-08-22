package com.kkunquizapp.QuizAppBackend.dto;

import com.kkunquizapp.QuizAppBackend.model.enums.FriendshipStatus;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendshipStatusResponseDTO {
    private FriendshipStatus status;
    // Nếu là REQUESTED/INCOMING thì có thể kèm requestId để FE thao tác (cancel/accept/decline)
    private UUID requestId;
}
