package com.kkunquizapp.QuizAppBackend.question.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class OptionRequestDTO {
    private UUID optionId;
    private String optionText;
    private boolean correct;
    private String correctAnswer;
}

