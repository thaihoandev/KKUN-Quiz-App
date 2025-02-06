package com.kkunquizapp.QuizAppBackend.dto;


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
    private UUID quizId; // ID of the quiz
    private List<OptionResponseDTO> options; // Options for the question
}
