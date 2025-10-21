package com.kkunquizapp.QuizAppBackend.article.controller;


import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;
import com.kkunquizapp.QuizAppBackend.article.service.SeriesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/series")
@RequiredArgsConstructor
public class SeriesController {

    private final SeriesService seriesService;

    @GetMapping("/{slug}")
    public ResponseEntity<SeriesDto> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(seriesService.getBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<SeriesDto> create(@RequestParam String title,
                                            @RequestParam(required = false) String description,
                                            @RequestParam(required = false) String thumbnailUrl) {
        return ResponseEntity.ok(seriesService.create(title, description, thumbnailUrl));
    }
}
