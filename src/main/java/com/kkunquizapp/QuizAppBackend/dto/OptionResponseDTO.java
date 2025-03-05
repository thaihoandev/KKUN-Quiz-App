package com.kkunquizapp.QuizAppBackend.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor

public class OptionResponseDTO {
    private UUID optionId;
    private String optionText;
    private boolean correct;
    private UUID questionId; // ID của câu hỏi chứa đáp án
}
