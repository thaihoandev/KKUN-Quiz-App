package com.kkunquizapp.QuizAppBackend.article.service;

import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SeriesService {
    Page<SeriesDto> getAll(Pageable pageable);
    SeriesDto getBySlug(String slug);
    SeriesDto create(String title, String description, String thumbnailUrl);
}
