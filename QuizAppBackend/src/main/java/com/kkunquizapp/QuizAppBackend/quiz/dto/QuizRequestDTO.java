package com.kkunquizapp.QuizAppBackend.quiz.dto;


import lombok.Data;

@Data
public class QuizRequestDTO {
    private String title;
    private String description;
    private String status;
}
