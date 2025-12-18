package com.kkunquizapp.QuizAppBackend.quiz.controller;

import com.kkunquizapp.QuizAppBackend.quiz.dto.*;
import com.kkunquizapp.QuizAppBackend.quiz.service.QuizService;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Quiz Management", description = "APIs for managing quizzes")
public class QuizController {

    private final QuizService quizService;

    // ==================== PUBLIC ENDPOINTS ====================

    @GetMapping("/published")
    @Operation(summary = "Get all published quizzes", description = "Get paginated list of all published public quizzes")
    public ResponseEntity<Page<QuizSummaryDto>> getPublishedQuizzes(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        log.info("Fetching published quizzes: keyword={}, page={}, size={}", keyword, page, size);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<QuizSummaryDto> quizzes = quizService.getPublicQuizzes(keyword, pageable);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get quiz by slug", description = "Get quiz details by URL-friendly slug (public)")
    public ResponseEntity<QuizDetailResponse> getQuizBySlug(
            @PathVariable String slug,
            @RequestParam(required = false) String password,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Fetching quiz by slug: {}", slug);
        UUID userId = currentUser != null ? currentUser.getUserId() : null;
        QuizDetailResponse quiz = quizService.getQuizDetailBySlug(slug, userId, password);
        return ResponseEntity.ok(quiz);
    }

    @GetMapping("/trending")
    @Operation(summary = "Get trending quizzes", description = "Get trending quizzes sorted by popularity")
    public ResponseEntity<Page<QuizSummaryDto>> getTrendingQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching trending quizzes");
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<QuizSummaryDto> quizzes = quizService.getTrendingQuizzes(pageable);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/difficulty/{difficulty}")
    @Operation(summary = "Get quizzes by difficulty", description = "Filter quizzes by difficulty level (EASY, MEDIUM, HARD)")
    public ResponseEntity<Page<QuizSummaryDto>> getQuizzesByDifficulty(
            @PathVariable String difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching quizzes by difficulty: {}", difficulty);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QuizSummaryDto> quizzes = quizService.getQuizzesByDifficulty(difficulty, pageable);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get quizzes by category", description = "Filter quizzes by category ID")
    public ResponseEntity<Page<QuizSummaryDto>> getQuizzesByCategory(
            @PathVariable Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching quizzes by category: {}", categoryId);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QuizSummaryDto> quizzes = quizService.getQuizzesByCategory(categoryId, pageable);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/category/{categoryId}/popular")
    @Operation(summary = "Get popular quizzes by category", description = "Get most popular quizzes in a category")
    public ResponseEntity<Page<QuizSummaryDto>> getPopularByCategory(
            @PathVariable Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching popular quizzes by category: {}", categoryId);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<QuizSummaryDto> quizzes = quizService.getPopularByCategory(categoryId, pageable);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get quizzes by user", description = "Get all published quizzes created by a specific user")
    public ResponseEntity<Page<QuizSummaryDto>> getQuizzesByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching quizzes for user: {}", userId);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QuizSummaryDto> quizzes = quizService.getMyQuizzes(userId, pageable);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/search")
    @Operation(summary = "Advanced search", description = "Search quizzes with multiple filters")
    public ResponseEntity<Page<QuizSummaryDto>> searchQuizzes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Searching quizzes: keyword={}, difficulty={}, category={}", keyword, difficulty, categoryId);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QuizSummaryDto> quizzes = quizService.searchQuizzes(keyword, difficulty, categoryId, pageable);
        return ResponseEntity.ok(quizzes);
    }

    // ==================== AUTHENTICATED USER ENDPOINTS ====================

    @GetMapping("/{quizId}")
    @Operation(summary = "Get quiz by ID", description = "Get quiz details by quiz ID (requires auth for private quizzes)")
    public ResponseEntity<QuizDetailResponse> getQuizById(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Fetching quiz by ID: {}", quizId);
        UUID userId = currentUser != null ? currentUser.getUserId() : null;
        QuizDetailResponse quiz = quizService.getQuizDetailById(quizId, userId);
        return ResponseEntity.ok(quiz);
    }

    @GetMapping("/my-quizzes")
    @Operation(summary = "Get my quizzes", description = "Get all quizzes created by current user (requires authentication)")
    public ResponseEntity<Page<QuizSummaryDto>> getMyQuizzes(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching quizzes for user: {}", currentUser.getUserId());
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QuizSummaryDto> quizzes = quizService.getMyQuizzes(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/my-drafts")
    @Operation(summary = "Get my draft quizzes", description = "Get all unpublished quizzes created by current user")
    public ResponseEntity<Page<QuizSummaryDto>> getMyDrafts(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching drafts for user: {}", currentUser.getUserId());
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QuizSummaryDto> drafts = quizService.getMyDrafts(currentUser.getUserId(), pageable);
        return ResponseEntity.ok(drafts);
    }

    @PostMapping
    @Operation(summary = "Create a new quiz", description = "Create a new quiz (requires authentication)")
    public ResponseEntity<QuizDetailResponse> createQuiz(
            @Valid @RequestBody QuizCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Creating quiz for user: {}", currentUser.getUserId());
        try {
            QuizDetailResponse quiz = quizService.createQuiz(request, currentUser.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(quiz);
        } catch (Exception e) {
            log.error("Error creating quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{quizId}")
    @Operation(summary = "Update quiz", description = "Update quiz details (only owner)")
    public ResponseEntity<QuizDetailResponse> updateQuiz(
            @PathVariable UUID quizId,
            @Valid @RequestBody QuizUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Updating quiz: {} by user: {}", quizId, currentUser.getUserId());
        try {
            QuizDetailResponse quiz = quizService.updateQuiz(quizId, request, currentUser.getUserId());
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            log.error("Error updating quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{quizId}/publish")
    @Operation(summary = "Publish quiz", description = "Publish quiz to make it publicly available")
    public ResponseEntity<Void> publishQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Publishing quiz: {} by user: {}", quizId, currentUser.getUserId());
        try {
            quizService.publishQuiz(quizId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error publishing quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{quizId}/unpublish")
    @Operation(summary = "Unpublish quiz", description = "Unpublish quiz to make it private/draft")
    public ResponseEntity<Void> unpublishQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Unpublishing quiz: {} by user: {}", quizId, currentUser.getUserId());
        try {
            quizService.unpublishQuiz(quizId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error unpublishing quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{quizId}")
    @Operation(summary = "Soft delete quiz", description = "Soft delete quiz (can be restored)")
    public ResponseEntity<Void> softDeleteQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Soft deleting quiz: {} by user: {}", quizId, currentUser.getUserId());
        try {
            quizService.softDeleteQuiz(quizId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{quizId}/hard")
    @Operation(summary = "Hard delete quiz", description = "Permanently delete quiz (cannot be restored)")
    public ResponseEntity<Void> hardDeleteQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Hard deleting quiz: {} by user: {}", quizId, currentUser.getUserId());
        try {
            quizService.hardDeleteQuiz(quizId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error hard deleting quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{quizId}/restore")
    @Operation(summary = "Restore quiz", description = "Restore a soft-deleted quiz")
    public ResponseEntity<Void> restoreQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Restoring quiz: {} by user: {}", quizId, currentUser.getUserId());
        try {
            quizService.restoreQuiz(quizId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error restoring quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{quizId}/duplicate")
    @Operation(summary = "Duplicate quiz", description = "Create a copy of existing quiz with all questions")
    public ResponseEntity<QuizDetailResponse> duplicateQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Duplicating quiz: {} by user: {}", quizId, currentUser.getUserId());
        try {
            QuizDetailResponse quiz = quizService.duplicateQuiz(quizId, currentUser.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(quiz);
        } catch (Exception e) {
            log.error("Error duplicating quiz: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== ANALYTICS & TRACKING ====================

    @PostMapping("/{quizId}/increment-view")
    @Operation(summary = "Increment view count", description = "Track quiz view (public endpoint)")
    public ResponseEntity<Void> incrementViewCount(@PathVariable UUID quizId) {
        quizService.incrementViewCount(quizId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{quizId}/increment-start")
    @Operation(summary = "Increment start count", description = "Track quiz start (public endpoint)")
    public ResponseEntity<Void> incrementStartCount(@PathVariable UUID quizId) {
        quizService.incrementStartCount(quizId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{quizId}/increment-completion")
    @Operation(summary = "Increment completion count", description = "Track quiz completion (public endpoint)")
    public ResponseEntity<Void> incrementCompletionCount(@PathVariable UUID quizId) {
        quizService.incrementCompletionCount(quizId);
        return ResponseEntity.ok().build();
    }
}