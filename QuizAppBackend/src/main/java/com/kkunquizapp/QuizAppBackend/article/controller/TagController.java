package com.kkunquizapp.QuizAppBackend.article.controller;

import com.kkunquizapp.QuizAppBackend.article.model.Tag;
import com.kkunquizapp.QuizAppBackend.article.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<Page<Tag>> getAll(
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(tagService.getAll(pageable));
    }

    @PostMapping
    public ResponseEntity<Tag> createTag(@RequestParam String name) {
        return ResponseEntity.ok(tagService.getOrCreate(name));
    }
}
