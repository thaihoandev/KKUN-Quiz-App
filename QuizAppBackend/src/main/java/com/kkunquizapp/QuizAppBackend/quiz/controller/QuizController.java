package com.kkunquizapp.QuizAppBackend.quiz.controller;

import com.kkunquizapp.QuizAppBackend.common.security.RequireQuizEdit;
import com.kkunquizapp.QuizAppBackend.common.security.RequireQuizView;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.FileUploadService;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.question.service.QuestionService;
import com.kkunquizapp.QuizAppBackend.quiz.service.QuizService;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final QuestionService questionService;
    private final FileUploadService fileUploadService;

    // ===================== PUBLIC ENDPOINTS =====================

    @GetMapping("/published")
    public ResponseEntity<Page<QuizResponseDTO>> getPublishedQuizzes(Pageable pageable) {
        try {
            Page<QuizResponseDTO> quizzes = quizService.getPublishedQuizzes(pageable);
            List<QuizResponseDTO> sorted = quizzes.getContent().stream()
                    .sorted(Comparator.comparingDouble(QuizResponseDTO::getRecommendationScore).reversed())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new PageImpl<>(sorted, pageable, quizzes.getTotalElements()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<Page<QuizResponseDTO>> getAllQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (page < 0 || size <= 0) return ResponseEntity.badRequest().build();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(quizService.getAllQuizzes(pageable));
    }

    // ===================== VIEW ENDPOINTS =====================

    @GetMapping("/{quizId}")
    @RequireQuizView
    public ResponseEntity<QuizResponseDTO> getQuizById(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(quizService.getQuizById(quizId));
    }

    @GetMapping("/{quizId}/questions")
    @RequireQuizView
    public ResponseEntity<Page<QuestionResponseDTO>> getQuestions(
            @PathVariable UUID quizId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if (page < 0 || size <= 0) return ResponseEntity.badRequest().build();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(questionService.getQuestionsByQuizId(quizId, pageable));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<Page<QuizResponseDTO>> getQuizzesByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) QuizStatus status
    ) {
        if (page < 0 || size <= 0) return ResponseEntity.badRequest().build();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(quizService.getQuizzesByUser(userId, pageable, status));
    }

    // ===================== CREATE ENDPOINTS =====================

    @PostMapping("/create")
    public ResponseEntity<QuizResponseDTO> addQuiz(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody QuizRequestDTO quizRequestDTO
    ) {
        try {
            QuizResponseDTO responseDTO = quizService.createQuiz(currentUser, quizRequestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping(value = "/create/from-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuizResponseDTO> createQuizFromFile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestPart("quiz") QuizRequestDTO quizRequestDTO,
            @RequestPart("file") MultipartFile file
    ) {
        try {
            if (quizRequestDTO.getTitle() == null || quizRequestDTO.getTitle().isBlank())
                return ResponseEntity.badRequest().build();

            if (file == null || file.isEmpty())
                return ResponseEntity.badRequest().build();

            if (quizRequestDTO.getStatus() == null || quizRequestDTO.getStatus().isBlank())
                quizRequestDTO.setStatus("DRAFT");

            QuizResponseDTO quizDto = quizService.createQuiz(currentUser, quizRequestDTO);
            UUID quizId = quizDto.getQuizId();

            Map<String, Object> data = fileUploadService.processFile(file, quizId);
            @SuppressWarnings("unchecked")
            List<QuestionRequestDTO> parsedQuestions = (List<QuestionRequestDTO>) data.getOrDefault("questions", Collections.emptyList());

            List<QuestionResponseDTO> savedQuestions = new ArrayList<>();
            for (QuestionRequestDTO q : parsedQuestions) {
                q.setQuizId(quizId);
                savedQuestions.add(questionService.addQuestion(q));
            }

            quizDto.setQuestions(savedQuestions);
            return ResponseEntity.ok(quizDto);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{quizId}/save-for-me")
    @RequireQuizView
    public ResponseEntity<QuizResponseDTO> saveForCurrentUser(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            QuizResponseDTO saved = quizService.saveForCurrentUser(currentUser, quizId);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ===================== EDIT ENDPOINTS =====================

    @PutMapping("/{quizId}/edit")
    @RequireQuizEdit
    public ResponseEntity<QuizResponseDTO> editQuiz(
            @PathVariable UUID quizId,
            @RequestBody QuizRequestDTO quizRequestDTO,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(quizService.updateQuiz(quizId, quizRequestDTO));
    }

    @DeleteMapping("/{quizId}/delete")
    @RequireQuizEdit
    public ResponseEntity<QuizResponseDTO> deleteQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(quizService.deleteQuiz(quizId));
    }

    @PutMapping("/{quizId}/published")
    @RequireQuizEdit
    public ResponseEntity<QuizResponseDTO> publishQuiz(
            @PathVariable UUID quizId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(quizService.publishedQuiz(quizId));
    }

    @PostMapping("/{quizId}/addViewerByEmail")
    @RequireQuizEdit
    public ResponseEntity<Void> addViewerByEmail(
            @PathVariable UUID quizId,
            @RequestParam String email,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        quizService.addViewerByEmail(quizId, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{quizId}/addEditorByEmail")
    @RequireQuizEdit
    public ResponseEntity<Void> addEditorByEmail(
            @PathVariable UUID quizId,
            @RequestParam String email,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        quizService.addEditorByEmail(quizId, email);
        return ResponseEntity.ok().build();
    }
}
