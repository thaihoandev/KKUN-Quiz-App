package com.kkunquizapp.QuizAppBackend.article.controller;

import com.kkunquizapp.QuizAppBackend.article.dto.SeriesDto;
import com.kkunquizapp.QuizAppBackend.article.service.SeriesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/series")
@RequiredArgsConstructor
public class SeriesController {

    private final SeriesService seriesService;

    @GetMapping
    public ResponseEntity<Page<SeriesDto>> getAll(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(seriesService.getAll(pageable));
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<Page<SeriesDto>> getByAuthor(
            @PathVariable UUID authorId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(seriesService.getByAuthor(authorId, pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<SeriesDto> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(seriesService.getBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<SeriesDto> create(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(required = false) String thumbnailUrl,
            @RequestParam UUID authorId) {
        return ResponseEntity.ok(seriesService.create(title, description, thumbnailUrl, authorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SeriesDto> update(
            @PathVariable UUID id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(required = false) String thumbnailUrl) {
        return ResponseEntity.ok(seriesService.update(id, title, description, thumbnailUrl));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        seriesService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // === Article management ===

    @PostMapping("/{seriesId}/articles/{articleId}")
    public ResponseEntity<SeriesDto> addArticle(
            @PathVariable UUID seriesId,
            @PathVariable UUID articleId,
            @RequestParam(defaultValue = "1") int orderIndex) {
        return ResponseEntity.ok(seriesService.addArticleToSeries(seriesId, articleId, orderIndex));
    }

    @DeleteMapping("/{seriesId}/articles/{articleId}")
    public ResponseEntity<Void> removeArticle(
            @PathVariable UUID seriesId,
            @PathVariable UUID articleId) {
        seriesService.removeArticleFromSeries(seriesId, articleId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{seriesId}/articles/order")
    public ResponseEntity<Void> updateOrder(
            @PathVariable UUID seriesId,
            @RequestBody List<UUID> orderedArticleIds) {
        seriesService.updateArticleOrder(seriesId, orderedArticleIds);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/articles/{articleId}/move-to/{seriesId}")
    public ResponseEntity<Void> moveArticleToSeries(
            @PathVariable UUID articleId,
            @PathVariable UUID seriesId) {
        seriesService.moveArticleToSeries(articleId, seriesId);
        return ResponseEntity.noContent().build();
    }
}
