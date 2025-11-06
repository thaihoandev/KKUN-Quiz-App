package com.kkunquizapp.QuizAppBackend.article.service;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface SeriesService {

    Page<SeriesDto> getAll(Pageable pageable);

    SeriesDto getBySlug(String slug);

    Page<SeriesDto> getByAuthor(UUID authorId, Pageable pageable);

    SeriesDto create(String title, String description, String thumbnailUrl, UUID authorId);

    SeriesDto update(UUID id, String title, String description, String thumbnailUrl);

    void delete(UUID id);

    SeriesDto addArticleToSeries(UUID seriesId, UUID articleId, int orderIndex);

    void removeArticleFromSeries(UUID seriesId, UUID articleId);

    void updateArticleOrder(UUID seriesId, List<UUID> orderedArticleIds);

    void moveArticleToSeries(UUID articleId, UUID newSeriesId);

    Page<ArticleDto> getUnassignedArticlesByAuthor(UUID authorId, Pageable pageable);

}