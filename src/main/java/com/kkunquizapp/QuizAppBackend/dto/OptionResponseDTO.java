package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class OptionResponseDTO {
    private UUID optionId;
    private String optionText;
    private boolean correct;
    private UUID questionId; // ID của câu hỏi chứa đáp án
}
