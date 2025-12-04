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
public class QuestionSearchDTO {
    private String keyword;
    private String questionType;
    private String difficulty;
    private List<String> tags;
    private boolean includeDeleted;
    private int page;
    private int pageSize;
}
