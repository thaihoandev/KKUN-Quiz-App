package com.kkunquizapp.QuizAppBackend.article.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleSeries;

import java.util.List;
import java.util.UUID;

public interface ArticleSeriesRepository extends JpaRepository<ArticleSeries, UUID> {
    List<ArticleSeries> findBySeriesIdOrderByOrderIndex(UUID seriesId);
}
