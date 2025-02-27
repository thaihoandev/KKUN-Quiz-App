package com.kkunquizapp.QuizAppBackend.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class QuestionRequestDTO {
    private String questionText;
    private String questionType; // "multiple_choice", "true_false", etc.
    private String imageUrl;
    private int timeLimit;
    private int points;
    private UUID quizId; // The ID of the quiz this question belongs to
    private List<OptionRequestDTO> options; // List of options for this question
}
