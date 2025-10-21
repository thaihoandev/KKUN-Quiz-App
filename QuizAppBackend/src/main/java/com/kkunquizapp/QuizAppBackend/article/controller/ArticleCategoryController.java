package com.kkunquizapp.QuizAppBackend.article.controller;


import com.kkunquizapp.QuizAppBackend.article.dto.ArticleCategoryDto;
import com.kkunquizapp.QuizAppBackend.article.service.ArticleCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/article-categories")
@RequiredArgsConstructor
public class ArticleCategoryController {

    private final ArticleCategoryService categoryService;

    @GetMapping
    public ResponseEntity<Page<ArticleCategoryDto>> getAllActive(
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(categoryService.getAllActive(pageable));
    }

    @PostMapping
    public ResponseEntity<ArticleCategoryDto> create(
            @RequestParam String name,
            @RequestParam String description) {
        return ResponseEntity.ok(categoryService.create(name, description));
    }
}
