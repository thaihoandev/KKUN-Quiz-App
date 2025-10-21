package com.kkunquizapp.QuizAppBackend.article.service.impl;


import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCreateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.mapper.ArticleMapper;
import com.kkunquizapp.QuizAppBackend.article.model.Article;
import com.kkunquizapp.QuizAppBackend.article.model.ArticleCategory;
import com.kkunquizapp.QuizAppBackend.article.repository.ArticleRepository;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleCategoryService;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleService;
import com.kkunquizapp.QuizAppBackend.common.utils.MarkdownProcessor;
import com.kkunquizapp.QuizAppBackend.common.utils.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.CloudinaryService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private final ArticleMapper mapper;

    @Override
    public List<ArticleDto> getAllPublished() {
        return articleRepository.findByPublishedTrue()
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ArticleDto getBySlug(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        return mapper.toDto(article);
    }

    /**
     * Create new Article (with optional Cloudinary thumbnail upload)
     */
    @Override
    public ArticleDto create(ArticleCreateRequest req) {
        // 🔹 1. Lấy category entity theo ID
        ArticleCategory category = categoryService.getById(req.getCategoryId());

        // 🔹 2. Chuẩn bị entity bài viết
        Article article = new Article();
        article.setTitle(req.getTitle());
        article.setSlug(SlugUtil.toSlug(req.getTitle()));
        article.setContentMarkdown(req.getContentMarkdown());
        article.setContentHtml(markdownProcessor.toHtml(req.getContentMarkdown()));
        article.setArticleCategory(category);
        article.setDifficulty(req.getDifficulty());
        article.setAuthorId(req.getAuthorId());
        article.setPublished(true);

        // 🔹 3. Upload thumbnail lên Cloudinary nếu có
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

        // 🔹 4. Lưu vào DB
        articleRepository.save(article);
        return mapper.toDto(article);
    }

    /**
     * Lấy tất cả bài viết đã publish theo category.
     * Dùng trong UI: hiển thị danh sách bài viết của từng chuyên mục.
     */
    public List<ArticleDto> getPublishedByCategory(UUID categoryId) {
        ArticleCategory category = categoryService.getById(categoryId);
        return articleRepository.findByArticleCategoryAndPublishedTrue(category)
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}

