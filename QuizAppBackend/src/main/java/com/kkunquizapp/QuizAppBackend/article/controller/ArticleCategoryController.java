package com.kkunquizapp.QuizAppBackend.article.controller;


import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/article-categories")
@RequiredArgsConstructor
public class ArticleCategoryController {

    private final ArticleCategoryService service;

    @GetMapping
    public ResponseEntity<List<ArticleCategoryDto>> getAll() {
        return ResponseEntity.ok(service.getAllActive());
    }

    @PostMapping
    public ResponseEntity<ArticleCategoryDto> create(@RequestParam String name,
                                                     @RequestParam(required = false) String description) {
        return ResponseEntity.ok(service.create(name, description));
    }
}
