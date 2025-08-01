package com.kkunquizapp.QuizAppBackend.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
public class OptionRequestDTO {
    private UUID optionId;
    private String optionText;
    private boolean correct;
    private String correctAnswer;
}

