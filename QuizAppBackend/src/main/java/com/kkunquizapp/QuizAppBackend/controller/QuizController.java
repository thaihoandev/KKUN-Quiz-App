package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.service.FileUploadService;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import com.kkunquizapp.QuizAppBackend.service.QuizService;
import jakarta.annotation.security.PermitAll;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {
    @Autowired
    private QuizService quizService;
    @Autowired
    private QuestionService questionService;
    @Autowired
    private FileUploadService fileUploadService;
    @GetMapping
    public ResponseEntity<Page<QuizResponseDTO>> getAllQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            if (page < 0 || size <= 0) {
                return ResponseEntity.badRequest().build();
            }
            Pageable pageable = PageRequest.of(page, size);
            Page<QuizResponseDTO> responseDTO = quizService.getAllQuizzes(pageable);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponseDTO> getQuizzById(
            @PathVariable UUID quizId) {
        try {
            QuizResponseDTO responseDTO = quizService.getQuizById(quizId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<Page<QuizResponseDTO>> getQuizzesByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) QuizStatus status) {
        try {
            if (page < 0 || size <= 0) {
                return ResponseEntity.badRequest().build();
            }
            Pageable pageable = PageRequest.of(page, size);
            Page<QuizResponseDTO> responseDTO = quizService.getQuizzesByUser(userId, pageable, status);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{quizId}/questions")
    public ResponseEntity<List<QuestionResponseDTO>> getQuestions(@PathVariable UUID quizId) {
        try {
            List<QuestionResponseDTO> questions = questionService.getQuestionsByQuizId(quizId);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/create")
    public ResponseEntity<QuizResponseDTO> addQuiz(HttpServletRequest request, @RequestBody QuizRequestDTO quizRequestDTO) {
        try {
            QuizResponseDTO responseDTO = quizService.createQuiz(request, quizRequestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{quizId}/edit")
    public ResponseEntity<QuizResponseDTO> editQuiz(@PathVariable UUID quizId, @RequestBody QuizRequestDTO quizRequestDTO) {
        try {
            QuizResponseDTO responseDTO = quizService.updateQuiz(quizId, quizRequestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{quizId}/delete")
    public ResponseEntity<QuizResponseDTO> deleteQuiz(@PathVariable UUID quizId) {
        try {
            QuizResponseDTO responseDTO = quizService.deleteQuiz(quizId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{quizId}/published")
    public ResponseEntity<QuizResponseDTO> publishedQuiz(@PathVariable UUID quizId) {
        try {
            QuizResponseDTO responseDTO = quizService.publishedQuiz(quizId);
            return ResponseEntity.ok(responseDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/{quizId}/addViewerByEmail")
    public ResponseEntity<Void> addViewerByEmail(@PathVariable UUID quizId, @RequestParam String email) {
        try {
            quizService.addViewerByEmail(quizId, email);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{quizId}/addEditorByEmail")
    public ResponseEntity<Void> addEditorByEmail(@PathVariable UUID quizId, @RequestParam String email) {
        try {
            quizService.addEditorByEmail(quizId, email);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/published")
    @PermitAll
    public Page<QuizResponseDTO> getPublishedQuizzes(Pageable pageable) {
        Page<QuizResponseDTO> quizzes = quizService.getPublishedQuizzes(pageable);

        // Sort by recommendation score (if needed)
        List<QuizResponseDTO> sortedQuizzes = quizzes.getContent().stream()
                .sorted(Comparator.comparingDouble(QuizResponseDTO::getRecommendationScore).reversed())
                .collect(Collectors.toList());

        // Create a new Page object with sorted content
        return new PageImpl<>(sortedQuizzes, pageable, quizzes.getTotalElements());
    }

    @PostMapping(value = "/create/from-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuizResponseDTO> createQuizFromFile(
            HttpServletRequest request,
            @RequestPart(value = "quiz", required = true) QuizRequestDTO quizRequestDTO,
            @RequestPart(value = "file", required = true) MultipartFile file) {
        // Validate quiz metadata
        if (quizRequestDTO.getTitle() == null || quizRequestDTO.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        // Validate file
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        try {
            // 1. Create quiz with provided metadata
            if (quizRequestDTO.getStatus() == null || quizRequestDTO.getStatus().isBlank()) {
                quizRequestDTO.setStatus("DRAFT");
            }
            QuizResponseDTO quizDto = quizService.createQuiz(request, quizRequestDTO);
            UUID quizId = quizDto.getQuizId();

            // 2. Process file to extract questions
            Map<String, Object> data = fileUploadService.processFile(file, quizId);
            @SuppressWarnings("unchecked")
            List<QuestionRequestDTO> parsedQuestions = (List<QuestionRequestDTO>) data.get("questions");
            if (parsedQuestions == null) {
                parsedQuestions = Collections.emptyList();
            }

            // 3. Persist questions under quizId
            List<QuestionResponseDTO> savedQuestions = new ArrayList<>();
            for (QuestionRequestDTO q : parsedQuestions) {
                q.setQuizId(quizId);
                savedQuestions.add(questionService.addQuestion(q));
            }
            quizDto.setQuestions(savedQuestions);

            return ResponseEntity.ok(quizDto);
        } catch (Exception e) {
            // Optional: rollback quiz creation on failure
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/{quizId}/save-for-me")
    public ResponseEntity<QuizResponseDTO> saveForCurrentUser(
            HttpServletRequest request,
            @PathVariable UUID quizId) {
        try {
            QuizResponseDTO saved = quizService.saveForCurrentUser(request, quizId);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

}
