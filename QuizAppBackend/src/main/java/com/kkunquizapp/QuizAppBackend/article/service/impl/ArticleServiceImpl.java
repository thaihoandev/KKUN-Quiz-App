package com.kkunquizapp.QuizAppBackend.article.service.impl;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCreateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.mapper.ArticleMapper;
import com.kkunquizapp.QuizAppBackend.article.model.Article;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import com.kkunquizapp.QuizAppBackend.article.repository.ArticleRepository;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleCategoryService;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleService;
import com.kkunquizapp.QuizAppBackend.article.service.TagService;
import com.kkunquizapp.QuizAppBackend.common.utils.MarkdownProcessor;
import com.kkunquizapp.QuizAppBackend.common.utils.SlugUtil;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleCategoryService categoryService;
    private final MarkdownProcessor markdownProcessor;
    private final CloudinaryService cloudinaryService;
    private final TagService tagService;
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
        return mapper.toDto(article);
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
        String baseSlug = SlugUtil.toSlug(req.getTitle());
        String slug = baseSlug;
        if (articleRepository.findBySlug(slug).isPresent()) {
            // Append a short UUID (first 8 characters) to ensure uniqueness
            slug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 8);
        }
        article.setSlug(slug);

        article.setContentMarkdown(req.getContentMarkdown());
        article.setContentHtml(markdownProcessor.toHtml(req.getContentMarkdown()));
        article.setArticleCategory(category);
        article.setDifficulty(req.getDifficulty());
        article.setAuthorId(req.getAuthorId());
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
}