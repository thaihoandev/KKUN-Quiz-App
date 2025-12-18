package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptionAnalyticsDTO {
    private UUID optionId;
    private String optionText;
    private int selectCount;
    private int correctSelectCount;
    private double selectPercentage;
    private boolean isCorrect;
}
