package com.kkunquizapp.QuizAppBackend.question.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuestionRequestDTO {
    private UUID quizId;
    private String questionText;
    private String questionType; // Sử dụng string để match với enum
    private String imageUrl;
    private MultipartFile image;
    private int timeLimit;
    private int points;
    private List<OptionRequestDTO> options;
}
