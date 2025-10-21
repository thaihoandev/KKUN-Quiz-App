package com.kkunquizapp.QuizAppBackend.article.controller;


import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;
import com.kkunquizapp.QuizAppBackend.article.service.SeriesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;


@RestController
@RequestMapping("/api/series")
@RequiredArgsConstructor
public class SeriesController {

    private final SeriesService seriesService;

    @GetMapping
    public ResponseEntity<Page<SeriesDto>> getAll(
            @PageableDefault(size = 10, sort = "title") Pageable pageable) {
        return ResponseEntity.ok(seriesService.getAll(pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<SeriesDto> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(seriesService.getBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<SeriesDto> create(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(required = false) String thumbnailUrl) {
        return ResponseEntity.ok(seriesService.create(title, description, thumbnailUrl));
    }
}
