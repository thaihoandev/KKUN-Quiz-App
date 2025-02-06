package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

@Data
public class PlayerRequestDTO {
    private String nickname;
    private boolean isAnonymous;
    private int score;
}

