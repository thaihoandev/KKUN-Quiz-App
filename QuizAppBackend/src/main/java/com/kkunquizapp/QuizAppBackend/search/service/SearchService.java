package com.kkunquizapp.QuizAppBackend.search.service;

import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizDetailResponse;

import java.util.List;

public interface SearchService {
    List<QuizDetailResponse> searchQuizzesByTitle(String title);
}
