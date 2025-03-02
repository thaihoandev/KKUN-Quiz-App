package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;

import java.util.List;

public interface SearchService {
    List<QuizResponseDTO> searchQuizzesByTitle(String title);
}
