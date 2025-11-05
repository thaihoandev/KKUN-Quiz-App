package com.kkunquizapp.QuizAppBackend.article.service.impl;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCreateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleUpdateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.SeriesSummaryDto;
import com.kkunquizapp.QuizAppBackend.article.mapper.ArticleMapper;
import com.kkunquizapp.QuizAppBackend.article.model.Article;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleSeries;
import com.kkunquizapp.QuizAppBackend.article.repository.ArticleRepository;
import com.kkunquizapp.QuizAppBackend.article.repository.ArticleSeriesRepository;
import com.kkunquizapp.QuizAppBackend.article.repository.SeriesRepository;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleCategoryService;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleService;
import com.kkunquizapp.QuizAppBackend.article.service.TagService;
import com.kkunquizapp.QuizAppBackend.common.utils.MarkdownProcessor;
import com.kkunquizapp.QuizAppBackend.common.utils.SlugUtil;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.CloudinaryService;
import com.kkunquizapp.QuizAppBackend.user.dto.UserSummaryDto;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.user.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashSet;

import java.util.Map;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleSeriesRepository articleSeriesRepository;
    private final SeriesRepository seriesRepository;

    private final ArticleCategoryService categoryService;
    private final MarkdownProcessor markdownProcessor;
    private final CloudinaryService cloudinaryService;
    private final TagService tagService;
    private final UserService userService;
    private final ArticleMapper mapper;

    /**
     * Get all published articles.
     * @return List of ArticleDto for published articles.
     */
    @Override
    public Page<ArticleDto> getAllPublished(Pageable pageable) {
        return articleRepository.findByPublishedTrue(pageable)
                .map(mapper::toDto);
    }

    /**
     * Get an article by its slug.
     * @param slug The slug of the article.
     * @return ArticleDto for the found article.
     * @throws ResponseStatusException if the article is not found.
     */
    @Override
    public ArticleDto getBySlug(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found with slug: " + slug));

        // Tăng lượt xem
        article.setViews(article.getViews() + 1);
        articleRepository.save(article);

        ArticleDto dto = mapper.toDto(article);

        // ✅ Gắn thông tin series rút gọn (nếu có)
        articleSeriesRepository.findByArticleId(article.getId()).ifPresent(link -> {
            seriesRepository.findById(link.getSeriesId()).ifPresent(series -> {
                SeriesSummaryDto summary = new SeriesSummaryDto();
                summary.setId(series.getId());
                summary.setTitle(series.getTitle());
                summary.setSlug(series.getSlug());
                summary.setDescription(series.getDescription());
                summary.setThumbnailUrl(series.getThumbnailUrl());
                dto.setSeries(summary);
            });
        });

        return dto;
    }


    /**
     * Create a new article with optional Cloudinary thumbnail upload.
     * Ensures unique slugs by appending a short UUID if necessary.
     * @param req The article creation request.
     * @return ArticleDto for the created article.
     */
    @Override
    public ArticleDto create(ArticleCreateRequest req) {
        // 1. Fetch category entity by ID
        ArticleCategory category = categoryService.getById(req.getCategoryId());

        // 2. Prepare article entity
        Article article = new Article();
        article.setTitle(req.getTitle());

        // Generate unique slug
        String slug = SlugUtil.toSlug(req.getTitle(),true);

        article.setSlug(slug);

        article.setContentMarkdown(req.getContentMarkdown());
        article.setContentHtml(markdownProcessor.toHtml(req.getContentMarkdown()));

        // Tính thời gian đọc
        int words = req.getContentMarkdown().split("\\s+").length;
        int readingTime = Math.max(1, words / 200);
        article.setReadingTime(readingTime);
        article.setAuthorId(req.getAuthorId());
        article.setArticleCategory(category);
        article.setDifficulty(req.getDifficulty());
        article.setPublished(true);

        // 3. Handle tags
        if (req.getTags() != null && !req.getTags().isEmpty()) {
            article.setTags(new HashSet<>(tagService.getOrCreateMany(req.getTags())));
        }

        // 4. Upload thumbnail to Cloudinary if provided
        MultipartFile thumbnail = req.getThumbnail();
        if (thumbnail != null && !thumbnail.isEmpty()) {
            try {
                String publicId = "articles/thumbnails/" + UUID.randomUUID();
                Map uploadResult = cloudinaryService.upload(thumbnail, publicId);
                String imageUrl = (String) uploadResult.get("secure_url");
                article.setThumbnailUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload thumbnail to Cloudinary", e);
            }
        }

        // 5. Save to database
        articleRepository.save(article);

        if (req.getSeriesId() != null) {
            ArticleSeries link = new ArticleSeries();
            link.setSeriesId(req.getSeriesId());
            link.setArticleId(article.getId());

            // Lấy thứ tự tiếp theo trong series
            int nextOrder = articleSeriesRepository
                    .findBySeriesIdOrderByOrderIndex(req.getSeriesId())
                    .size() + 1;

            link.setOrderIndex(nextOrder);
            articleSeriesRepository.save(link);
        }

        return mapper.toDto(article);
    }

    /**
     * Get all published articles by category.
     * Used in UI to display articles for a specific category.
     * @param categoryId The ID of the category.
     * @return List of ArticleDto for published articles in the category.
     */
    @Override
    public Page<ArticleDto> getPublishedByCategory(UUID categoryId, Pageable pageable) {
        ArticleCategory category = categoryService.getById(categoryId);
        return articleRepository.findByArticleCategoryAndPublishedTrue(category, pageable)
                .map(mapper::toDto);
    }

    @Override
    public ArticleDto update(String slug, ArticleUpdateRequest req) {
        // 1️⃣ Tìm bài viết hiện có
        Article article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found: " + slug));

        User currentUser = userService.getCurrentUser();
        if (!article.getAuthorId().equals(currentUser.getUserId())
                && currentUser.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền chỉnh sửa bài viết này");
        }

        // 2️⃣ Cập nhật các trường cơ bản
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            article.setTitle(req.getTitle());
        }

        if (req.getContentMarkdown() != null) {
            article.setContentMarkdown(req.getContentMarkdown());
            article.setContentHtml(markdownProcessor.toHtml(req.getContentMarkdown()));

            // Cập nhật thời gian đọc
            int words = req.getContentMarkdown().split("\\s+").length;
            article.setReadingTime(Math.max(1, words / 200));
        }

        if (req.getCategoryId() != null) {
            ArticleCategory category = categoryService.getById(req.getCategoryId());
            article.setArticleCategory(category);
        }

        article.setDifficulty(req.getDifficulty());

        // 3️⃣ Cập nhật tags
        if (req.getTags() != null) {
            article.setTags(new HashSet<>(tagService.getOrCreateMany(req.getTags())));
        }

        // 4️⃣ Cập nhật thumbnail nếu có file mới
        MultipartFile thumbnail = req.getThumbnail();
        if (thumbnail != null && !thumbnail.isEmpty()) {
            try {
                String publicId = "articles/thumbnails/" + UUID.randomUUID();
                Map uploadResult = cloudinaryService.upload(thumbnail, publicId);
                String imageUrl = (String) uploadResult.get("secure_url");
                article.setThumbnailUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload new thumbnail", e);
            }
        }

        // 5️⃣ Cập nhật series (nếu có)
        if (req.getSeriesId() != null) {
            // Xóa liên kết cũ (nếu có)
            articleSeriesRepository.findByArticleId(article.getId())
                    .ifPresent(articleSeriesRepository::delete);

            // Tạo liên kết mới
            ArticleSeries link = new ArticleSeries();
            link.setArticleId(article.getId());
            link.setSeriesId(req.getSeriesId());
            int nextOrder = articleSeriesRepository
                    .findBySeriesIdOrderByOrderIndex(req.getSeriesId())
                    .size() + 1;
            link.setOrderIndex(nextOrder);
            articleSeriesRepository.save(link);
        }

        // 6️⃣ Lưu thay đổi
        articleRepository.save(article);
        return mapper.toDto(article);
    }

    @Override
    public void delete(UUID id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found: " + id));

        User currentUser = userService.getCurrentUser();
        if (!article.getAuthorId().equals(currentUser.getUserId())
                && currentUser.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa bài viết này");
        }
        // Xóa liên kết series nếu có
        articleSeriesRepository.findByArticleId(article.getId())
                .ifPresent(articleSeriesRepository::delete);

        articleRepository.delete(article);
    }

}