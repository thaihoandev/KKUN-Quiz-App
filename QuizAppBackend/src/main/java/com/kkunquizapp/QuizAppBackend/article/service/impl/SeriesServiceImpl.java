package com.kkunquizapp.QuizAppBackend.article.service.impl;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;
import com.kkunquizapp.QuizAppBackend.article.mapper.ArticleMapper;
import com.kkunquizapp.QuizAppBackend.article.model.*;
import com.kkunquizapp.QuizAppBackend.article.repository.*;
import com.kkunquizapp.QuizAppBackend.article.service.SeriesService;
import com.kkunquizapp.QuizAppBackend.common.utils.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeriesServiceImpl implements SeriesService {

    private final SeriesRepository seriesRepository;
    private final ArticleSeriesRepository articleSeriesRepository;
    private final ArticleRepository articleRepository;
    private final ArticleMapper mapper;

    @Override
    public Page<SeriesDto> getAll(Pageable pageable) {
        return seriesRepository.findAll(pageable)
                .map(this::toDtoWithoutArticles);
    }

    @Override
    public SeriesDto getBySlug(String slug) {
        Series series = seriesRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Series not found"));

        List<ArticleSeries> links = articleSeriesRepository.findBySeriesIdOrderByOrderIndex(series.getId());
        List<ArticleDto> articles = links.stream()
                .map(link -> articleRepository.findById(link.getArticleId()).orElse(null))
                .filter(a -> a != null)
                .map(mapper::toDto)
                .collect(Collectors.toList());

        SeriesDto dto = toDtoWithoutArticles(series);
        dto.setArticles(articles);
        return dto;
    }

    @Override
    public SeriesDto create(String title, String description, String thumbnailUrl) {
        Series s = new Series();
        s.setTitle(title);
        s.setSlug(SlugUtil.toSlug(title));
        s.setDescription(description);
        s.setThumbnailUrl(thumbnailUrl);
        seriesRepository.save(s);
        return toDtoWithoutArticles(s);
    }

    // Helper method: convert Series entity → DTO (không kèm danh sách bài viết)
    private SeriesDto toDtoWithoutArticles(Series s) {
        SeriesDto dto = new SeriesDto();
        dto.setId(s.getId());
        dto.setTitle(s.getTitle());
        dto.setSlug(s.getSlug());
        dto.setDescription(s.getDescription());
        dto.setThumbnailUrl(s.getThumbnailUrl());
        return dto;
    }
}
