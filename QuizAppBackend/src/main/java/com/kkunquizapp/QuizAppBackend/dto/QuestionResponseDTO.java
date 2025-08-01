package com.kkunquizapp.QuizAppBackend.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class QuestionResponseDTO {
    private UUID questionId;
    private String questionText;
    private String questionType;
    private String imageUrl;
    private int timeLimit;
    private int points;
    private List<OptionResponseDTO> options;
}
