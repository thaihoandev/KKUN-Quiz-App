package com.kkunquizapp.QuizAppBackend.question.controller;

import com.kkunquizapp.QuizAppBackend.common.security.RequireQuizEdit;
import com.kkunquizapp.QuizAppBackend.common.security.RequireQuizView;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.FileUploadService;
import com.kkunquizapp.QuizAppBackend.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes/{quizId}/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final FileUploadService fileUploadService;

    // ✅ Require HOST or EDITOR
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequireQuizEdit
    public ResponseEntity<QuestionResponseDTO> addQuestion(
            @PathVariable UUID quizId,
            @RequestPart("question") QuestionRequestDTO questionRequestDTO,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            questionRequestDTO.setQuizId(quizId);

            if (image != null && !image.isEmpty()) {
                questionRequestDTO.setImage(image);
            }

            QuestionResponseDTO responseDTO = questionService.addQuestion(questionRequestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // ✅ Require HOST or EDITOR
    @PostMapping("/bulk")
    @RequireQuizEdit
    public ResponseEntity<List<QuestionResponseDTO>> addQuestionsBulk(
            @PathVariable UUID quizId,
            @RequestBody List<QuestionRequestDTO> questionDTOs) {
        try {
            // Đảm bảo quizId đồng nhất theo path param
            questionDTOs.forEach(dto -> dto.setQuizId(quizId));
            List<QuestionResponseDTO> result = questionService.addQuestions(questionDTOs);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // ✅ Public - không cần authentication (hoặc thêm @RequireQuizView nếu muốn restrict)
    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionResponseDTO> getQuestionById(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId) {
        try {
            QuestionResponseDTO responseDTO = questionService.getQuestionById(questionId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Require HOST or EDITOR
    @PutMapping(value = "/{questionId}/edit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequireQuizEdit
    public ResponseEntity<QuestionResponseDTO> updateQuestion(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId,
            @RequestPart("question") QuestionRequestDTO questionRequestDTO,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            questionRequestDTO.setQuizId(quizId);

            if (image != null && !image.isEmpty()) {
                questionRequestDTO.setImage(image);
            }

            QuestionResponseDTO updatedQuestion = questionService.updateQuestion(questionId, questionRequestDTO);
            return ResponseEntity.ok(updatedQuestion);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // ✅ Require HOST or EDITOR
    @PatchMapping("/{questionId}/soft-delete")
    @RequireQuizEdit
    public ResponseEntity<QuestionResponseDTO> softDeleteQuestion(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId) {
        try {
            QuestionResponseDTO deletedQuestion = questionService.softDeleteQuestion(questionId);
            return ResponseEntity.ok(deletedQuestion);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}