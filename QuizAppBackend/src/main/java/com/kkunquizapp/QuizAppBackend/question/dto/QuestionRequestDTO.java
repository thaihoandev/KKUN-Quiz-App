package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

// ==================== REQUEST DTO ====================

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionRequestDTO {
    private UUID quizId;
    private String questionText;
    private String questionType; // MULTIPLE_CHOICE, SINGLE_CHOICE, TRUE_FALSE, FILL_IN_THE_BLANK, MATCHING, ORDERING, DRAG_DROP, SHORT_ANSWER, ESSAY, HOTSPOT, IMAGE_SELECTION, DROPDOWN, MATRIX, RANKING
    private String imageUrl;
    private MultipartFile image;
    private int timeLimitSeconds;
    private int points;
    private int orderIndex;
    private String explanation;
    private String hint;
    private String difficulty; // EASY, MEDIUM, HARD
    private List<String> tags;
    private boolean shuffleOptions;
    private boolean caseInsensitive;
    private boolean partialCredit;
    private boolean allowMultipleCorrect;
    private List<String> answerVariations;

    // Options list - content depends on question type
    private List<OptionRequestDTO> options;
}

