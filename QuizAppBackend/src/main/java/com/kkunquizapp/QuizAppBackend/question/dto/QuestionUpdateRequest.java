package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionUpdateRequest {
    private String questionText;
    private String explanation;
    private String hint;
    private String difficulty;
    private List<String> tags;
    private int points;
    private int timeLimitSeconds;
    private boolean shuffleOptions;
    private boolean caseInsensitive;
    private boolean partialCredit;
    private List<OptionRequestDTO> options;
}
