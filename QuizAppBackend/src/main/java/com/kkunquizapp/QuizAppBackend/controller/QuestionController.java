package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.service.FileUploadService;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes/{quizId}/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @Autowired
    private FileUploadService fileUploadService;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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

    @PostMapping("/bulk")
    public ResponseEntity<List<QuestionResponseDTO>> addQuestionsBulk(
            @PathVariable UUID quizId,
            @RequestBody List<QuestionRequestDTO> questionDTOs
    ) {
        // đảm bảo quizId đồng nhất theo path param
        questionDTOs.forEach(dto -> dto.setQuizId(quizId));
        List<QuestionResponseDTO> result = questionService.addQuestions(questionDTOs);
        return ResponseEntity.ok(result);
    }

    // Lấy thông tin câu hỏi theo ID
    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionResponseDTO> getQuestionById(
            @PathVariable UUID questionId) {
        try {
            QuestionResponseDTO responseDTO = questionService.getQuestionById(questionId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping(value = "/{questionId}/edit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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



    // Xóa câu hỏi
    @PatchMapping("/{questionId}/soft-delete")
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