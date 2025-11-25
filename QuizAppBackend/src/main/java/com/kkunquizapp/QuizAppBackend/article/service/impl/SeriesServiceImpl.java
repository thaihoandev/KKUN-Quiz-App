package com.kkunquizapp.QuizAppBackend.article.service.impl;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;
import com.kkunquizapp.QuizAppBackend.article.mapper.ArticleMapper;
import com.kkunquizapp.QuizAppBackend.article.model.*;
import com.kkunquizapp.QuizAppBackend.article.repository.*;
import com.kkunquizapp.QuizAppBackend.article.service.SeriesService;
import com.kkunquizapp.QuizAppBackend.common.utils.SlugUtil;
import com.kkunquizapp.QuizAppBackend.user.dto.UserSummaryDto;
import com.kkunquizapp.QuizAppBackend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeriesServiceImpl implements SeriesService {

    private final SeriesRepository seriesRepository;
    private final ArticleRepository articleRepository;
    private final ArticleSeriesRepository articleSeriesRepository;
    private final ArticleMapper mapper;
    private final UserService userService; // ✅ Thêm vào đây

    @Override
    public Page<SeriesDto> getAll(Pageable pageable) {
        return seriesRepository.findAll(pageable)
                .map(this::toDtoWithoutArticles);
    }

    @Override
    public Page<SeriesDto> getByAuthor(UUID authorId, Pageable pageable) {
        return seriesRepository.findByAuthorId(authorId, pageable)
                .map(this::toDtoWithoutArticles);
    }

    @Override
    public SeriesDto getBySlug(String slug) {
        Series series = seriesRepository.findBySlugWithRelations(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Series not found"));

        // Lấy ArticleSeries đã fetch sẵn từ series
        List<ArticleSeries> links = series.getArticles() == null
                ? new ArrayList<>()
                : series.getArticles().stream()
                .sorted(Comparator.comparing(ArticleSeries::getOrderIndex))
                .toList();

        // Map ArticleSeries -> ArticleDto, KHÔNG query lại
        List<ArticleDto> articles = links.stream()
                .map(link -> {
                    Article article = link.getArticle(); // đã fetch join
                    ArticleDto dto = mapper.toDto(article);
                    dto.setOrderIndex(link.getOrderIndex());
                    return dto;
                })
                .collect(Collectors.toList());

        // Build DTO series
        SeriesDto dto = toDtoWithoutArticles(series);
        dto.setArticles(articles);

        return dto;
    }


    @Override
    @Transactional
    public SeriesDto create(String title, String description, String thumbnailUrl, UUID authorId) {
        Series s = new Series();
        s.setTitle(title);
        s.setSlug(SlugUtil.toSlug(title,true));
        s.setDescription(description);
        s.setThumbnailUrl(thumbnailUrl);
        s.setAuthorId(authorId);
        seriesRepository.save(s);
        return toDtoWithoutArticles(s);
    }

    @Override
    @Transactional
    public SeriesDto update(UUID id, String title, String description, String thumbnailUrl) {
        Series s = seriesRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Series not found"));
        s.setTitle(title);
        s.setDescription(description);
        s.setThumbnailUrl(thumbnailUrl);
        seriesRepository.save(s);
        return toDtoWithoutArticles(s);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!seriesRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Series not found");
        }
        articleSeriesRepository.deleteBySeriesId(id);
        seriesRepository.deleteById(id);
    }

    @Override
    @Transactional
    public SeriesDto addArticleToSeries(UUID seriesId, UUID articleId, int orderIndex) {
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Series not found"));
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));

        if (articleSeriesRepository.existsBySeriesIdAndArticleId(seriesId, articleId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Article already in series");
        }

        ArticleSeries link = new ArticleSeries();
        link.setSeriesId(seriesId);
        link.setArticleId(articleId);
        link.setOrderIndex(orderIndex);
        articleSeriesRepository.save(link);

        return getBySlug(series.getSlug());
    }

    @Override
    @Transactional
    public void removeArticleFromSeries(UUID seriesId, UUID articleId) {
        ArticleSeries link = articleSeriesRepository.findBySeriesIdAndArticleId(seriesId, articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not in series"));
        articleSeriesRepository.delete(link);
    }

    @Override
    @Transactional
    public void updateArticleOrder(UUID seriesId, List<UUID> orderedArticleIds) {
        List<ArticleSeries> links = articleSeriesRepository.findBySeriesIdOrderByOrderIndex(seriesId);
        Map<UUID, ArticleSeries> map = links.stream()
                .collect(Collectors.toMap(ArticleSeries::getArticleId, l -> l));

        for (int i = 0; i < orderedArticleIds.size(); i++) {
            UUID articleId = orderedArticleIds.get(i);
            ArticleSeries link = map.get(articleId);
            if (link != null) link.setOrderIndex(i + 1);
        }
        articleSeriesRepository.saveAll(links);
    }

    // ✅ Helper: map entity -> DTO + thông tin tác giả
    private SeriesDto toDtoWithoutArticles(Series s) {
        SeriesDto dto = new SeriesDto();
        dto.setId(s.getId());
        dto.setTitle(s.getTitle());
        dto.setSlug(s.getSlug());
        dto.setDescription(s.getDescription());
        dto.setThumbnailUrl(s.getThumbnailUrl());
        dto.setAuthorId(s.getAuthorId());

        try {
            UserSummaryDto author = userService.getPublicById(s.getAuthorId());
            if (author != null) {
                dto.setAuthorName(author.getName());
            }
        } catch (Exception ignored) {
            // tránh lỗi khi user bị xóa hoặc service lỗi
        }

        return dto;
    }

    @Override
    @Transactional
    public void moveArticleToSeries(UUID articleId, UUID newSeriesId) {
        // 1️⃣ Kiểm tra article tồn tại
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));

        // 2️⃣ Nếu bài đã nằm trong series nào đó → xóa liên kết cũ
        articleSeriesRepository.findAll()
                .stream()
                .filter(link -> link.getArticleId().equals(articleId))
                .forEach(articleSeriesRepository::delete);

        // 3️⃣ Kiểm tra series mới
        Series newSeries = seriesRepository.findById(newSeriesId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target series not found"));

        // 4️⃣ Tìm orderIndex kế tiếp trong series mới
        int nextOrder = articleSeriesRepository.findBySeriesIdOrderByOrderIndex(newSeriesId).size() + 1;

        // 5️⃣ Tạo liên kết mới
        ArticleSeries newLink = new ArticleSeries();
        newLink.setSeriesId(newSeriesId);
        newLink.setArticleId(articleId);
        newLink.setOrderIndex(nextOrder);
        articleSeriesRepository.save(newLink);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ArticleDto> getUnassignedArticlesByAuthor(UUID authorId, Pageable pageable) {
        Page<Article> page = articleRepository.findUnassignedByAuthorId(authorId, pageable);
        return page.map(mapper::toDto);
    }


}
