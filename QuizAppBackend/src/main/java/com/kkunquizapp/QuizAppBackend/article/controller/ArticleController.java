package com.kkunquizapp.QuizAppBackend.article.controller;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCreateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping
    public ResponseEntity<Page<ArticleDto>> getAll(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(articleService.getAllPublished(pageable));
    }

    @GetMapping("/category/{id}")
    public ResponseEntity<Page<ArticleDto>> getByCategory(
            @PathVariable UUID id,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(articleService.getPublishedByCategory(id, pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ArticleDto> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(articleService.getBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<ArticleDto> create(@ModelAttribute ArticleCreateRequest req) {
        return ResponseEntity.ok(articleService.create(req));
    }
}

