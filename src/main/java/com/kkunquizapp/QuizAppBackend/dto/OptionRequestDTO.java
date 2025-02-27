package com.kkunquizapp.QuizAppBackend.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor

public class OptionRequestDTO {
    private UUID optionId;
    private String optionText;
    private boolean correct;
}

