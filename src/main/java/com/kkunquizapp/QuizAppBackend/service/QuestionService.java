package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;

public interface QuestionService {
    QuestionResponseDTO addQuestion(QuestionRequestDTO questionRequestDTO);
}
