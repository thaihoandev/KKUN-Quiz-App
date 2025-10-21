package com.kkunquizapp.QuizAppBackend.article.controller;

import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCreateRequest;
import com.kkunquizapp.QuizAppBackend.article.dto.ArticleDto;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping
    public ResponseEntity<List<ArticleDto>> getAll() {
        return ResponseEntity.ok(articleService.getAllPublished());
    }

    @GetMapping("/category/{id}")
    public ResponseEntity<List<ArticleDto>> getByCategory(@PathVariable UUID id) {
        return ResponseEntity.ok(articleService.getPublishedByCategory(id));
    }

    @PostMapping
    public ResponseEntity<ArticleDto> create(@ModelAttribute ArticleCreateRequest req) {
        return ResponseEntity.ok(articleService.create(req));
    }
}
