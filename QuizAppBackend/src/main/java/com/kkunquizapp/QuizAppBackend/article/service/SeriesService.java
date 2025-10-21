package com.kkunquizapp.QuizAppBackend.article.service;

import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;

public interface SeriesService {
    SeriesDto getBySlug(String slug);
    SeriesDto create(String title, String description, String thumbnailUrl);
}
