package com.kkunquizapp.QuizAppBackend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendSuggestionDTO {
    private UUID userId;
    private String name;
    private String username;
    private String avatar;
    private int mutualFriends;
}
