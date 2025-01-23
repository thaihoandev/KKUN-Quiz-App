package com.kkunquizapp.QuizAppBackend.dto;


import lombok.Data;

@Data
public class OptionRequestDTO {
    private String optionText;
    private boolean correct;
}

