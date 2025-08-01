package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class PlayerRequestDTO {
    private UUID playerSession;
    private String nickname;
    private boolean isAnonymous;
    private int score;
}

