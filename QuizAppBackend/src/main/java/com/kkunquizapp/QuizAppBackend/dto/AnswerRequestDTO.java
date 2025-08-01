package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class AnswerRequestDTO {
    private UUID playerId;
    private UUID questionId;
    private List<UUID> selectedOptionIds;
    private String answerStr;
}