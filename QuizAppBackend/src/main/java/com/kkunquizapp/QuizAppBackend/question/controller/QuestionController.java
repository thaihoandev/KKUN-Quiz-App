package com.kkunquizapp.QuizAppBackend.question.controller;

import com.kkunquizapp.QuizAppBackend.question.dto.*;
import com.kkunquizapp.QuizAppBackend.question.service.QuestionService;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@Slf4j
public class QuestionController {

    private final QuestionService questionService;

    // ==================== CREATE QUESTION ====================

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionResponseDTO> addQuestion(
            @RequestPart("question") @Valid QuestionRequestDTO questionRequestDTO,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Adding question to quiz: {}", questionRequestDTO.getQuizId());
        try {
            if (image != null && !image.isEmpty()) {
                questionRequestDTO.setImage(image);
            }

            QuestionResponseDTO responseDTO = questionService.addQuestion(questionRequestDTO, currentUser.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (Exception e) {
            log.error("Error adding question: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<QuestionResponseDTO>> addQuestionsBulk(
            @RequestBody @Valid List<QuestionRequestDTO> questionDTOs,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Adding {} questions in bulk", questionDTOs.size());
        try {
            List<QuestionResponseDTO> result = questionService.addQuestions(questionDTOs, currentUser.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            log.error("Error adding questions in bulk: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== READ QUESTION ====================

    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionResponseDTO> getQuestionById(@PathVariable UUID questionId) {
        log.info("Fetching question: {}", questionId);
        try {
            QuestionResponseDTO responseDTO = questionService.getQuestionById(questionId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            log.error("Question not found: {}", questionId);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<Page<QuestionResponseDTO>> getQuestionsByQuiz(
            @PathVariable UUID quizId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching questions for quiz: {}", quizId);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "orderIndex"));
            Page<QuestionResponseDTO> questions = questionService.getQuestionsByQuiz(quizId, pageable);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            log.error("Error fetching questions for quiz {}: {}", quizId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<QuestionResponseDTO>> searchQuestions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String questionType,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Searching questions: keyword={}, type={}, difficulty={}", keyword, questionType, difficulty);
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<QuestionResponseDTO> questions = questionService.searchQuestions(keyword, questionType, difficulty, pageable);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            log.error("Error searching questions: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/tag/{tag}")
    public ResponseEntity<List<QuestionResponseDTO>> getQuestionsByTag(@PathVariable String tag) {
        log.info("Fetching questions by tag: {}", tag);
        try {
            List<QuestionResponseDTO> questions = questionService.getQuestionsByTag(tag);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            log.error("Error fetching questions by tag: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<QuestionResponseDTO>> getFavoriteQuestions(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Fetching favorite questions for user: {}", currentUser.getUserId());
        try {
            List<QuestionResponseDTO> questions = questionService.getFavoriteQuestions(currentUser.getUserId());
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            log.error("Error fetching favorite questions: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== UPDATE QUESTION ====================

    @PutMapping(value = "/{questionId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionResponseDTO> updateQuestion(
            @PathVariable UUID questionId,
            @RequestPart("question") @Valid QuestionUpdateRequest questionRequestDTO,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Updating question: {}", questionId);
        try {
            QuestionResponseDTO updatedQuestion = questionService.updateQuestion(
                    questionId,
                    questionRequestDTO,
                    currentUser.getUserId()
            );
            return ResponseEntity.ok(updatedQuestion);
        } catch (Exception e) {
            log.error("Error updating question: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== DELETE QUESTION ====================

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> softDeleteQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Soft deleting question: {}", questionId);
        try {
            questionService.softDeleteQuestion(questionId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error soft deleting question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{questionId}/hard")
    public ResponseEntity<Void> hardDeleteQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Hard deleting question: {}", questionId);
        try {
            questionService.hardDeleteQuestion(questionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error hard deleting question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{questionId}/restore")
    public ResponseEntity<Void> restoreQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Restoring question: {}", questionId);
        try {
            questionService.restoreQuestion(questionId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error restoring question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== DUPLICATE QUESTION ====================

    @PostMapping("/{questionId}/duplicate")
    public ResponseEntity<QuestionResponseDTO> duplicateQuestion(
            @PathVariable UUID questionId,
            @RequestParam UUID targetQuizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Duplicating question {} to quiz {}", questionId, targetQuizId);
        try {
            QuestionResponseDTO duplicated = questionService.duplicateQuestion(
                    questionId,
                    targetQuizId,
                    currentUser.getUserId()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
        } catch (Exception e) {
            log.error("Error duplicating question: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/duplicate-from-quiz")
    public ResponseEntity<List<QuestionResponseDTO>> duplicateQuestionsFromQuiz(
            @RequestParam UUID sourceQuizId,
            @RequestParam UUID targetQuizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Duplicating all questions from quiz {} to quiz {}", sourceQuizId, targetQuizId);
        try {
            List<QuestionResponseDTO> duplicated = questionService.duplicateQuestionsFromQuiz(
                    sourceQuizId,
                    targetQuizId,
                    currentUser.getUserId()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
        } catch (Exception e) {
            log.error("Error duplicating questions: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== BULK IMPORT/EXPORT ====================

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BulkQuestionImportResponse> importQuestionsFromCSV(
            @RequestPart("file") MultipartFile file,
            @RequestParam UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Importing questions from CSV for quiz: {}", quizId);
        try {
            BulkQuestionImportResponse response = questionService.importQuestionsFromCSV(
                    file,
                    quizId,
                    currentUser.getUserId()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error importing CSV: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportQuestionsAsCSV(@RequestParam UUID quizId) {
        log.info("Exporting questions as CSV for quiz: {}", quizId);
        try {
            byte[] csvData = questionService.exportQuestionsAsCSV(quizId);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=questions.csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvData);
        } catch (Exception e) {
            log.error("Error exporting CSV: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== ANALYTICS ====================

    @GetMapping("/{questionId}/analytics")
    public ResponseEntity<QuestionAnalyticsDTO> getQuestionAnalytics(@PathVariable UUID questionId) {
        log.info("Fetching analytics for question: {}", questionId);
        try {
            QuestionAnalyticsDTO analytics = questionService.getQuestionAnalytics(questionId);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            log.error("Error fetching analytics: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== FAVORITES ====================

    @PostMapping("/{questionId}/favorite")
    public ResponseEntity<Void> markAsFavorite(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Marking question {} as favorite", questionId);
        try {
            questionService.markAsFavorite(questionId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking as favorite: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{questionId}/favorite")
    public ResponseEntity<Void> unmarkAsFavorite(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        log.info("Unmarking question {} as favorite", questionId);
        try {
            questionService.unmarkAsFavorite(questionId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error unmarking as favorite: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}