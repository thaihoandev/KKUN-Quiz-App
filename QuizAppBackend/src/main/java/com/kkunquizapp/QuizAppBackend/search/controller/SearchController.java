package com.kkunquizapp.QuizAppBackend.search.controller;

import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {
    @Autowired
    private SearchService searchService;

    // Endpoint tìm kiếm quiz theo title
    @GetMapping
    public ResponseEntity<List<QuizResponseDTO>> searchQuizzes(
            @RequestParam(value = "q", required = false) String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of()); // Trả về danh sách rỗng nếu query trống
        }

        List<QuizResponseDTO> results = searchService.searchQuizzesByTitle(query);
        return ResponseEntity.ok(results);
    }
}
