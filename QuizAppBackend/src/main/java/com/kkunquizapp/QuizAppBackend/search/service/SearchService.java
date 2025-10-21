package com.kkunquizapp.QuizAppBackend.search.service;

import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizResponseDTO;

import java.util.List;

public interface SearchService {
    List<QuizResponseDTO> searchQuizzesByTitle(String title);
}
