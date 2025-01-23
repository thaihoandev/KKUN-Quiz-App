package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/quizzes/{quizId}/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    // Tạo câu hỏi mới cho quiz cụ thể
    @PostMapping("/create")
    public ResponseEntity<QuestionResponseDTO> addQuestion(
            @PathVariable UUID quizId,
            @RequestBody QuestionRequestDTO questionRequestDTO) {
        try {
            questionRequestDTO.setQuizId(quizId); // Gán quizId từ path vào DTO
            QuestionResponseDTO responseDTO = questionService.addQuestion(questionRequestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Lấy thông tin câu hỏi theo ID
    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionResponseDTO> getQuestion(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId) {
        try {
            QuestionResponseDTO responseDTO = questionService.getQuestionById(questionId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Cập nhật thông tin câu hỏi
    @PutMapping("/{questionId}")
    public ResponseEntity<QuestionResponseDTO> updateQuestion(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId,
            @RequestBody QuestionRequestDTO questionRequestDTO) {
        try {
            questionRequestDTO.setQuizId(quizId); // Gán quizId từ path vào DTO
            QuestionResponseDTO updatedQuestion = questionService.updateQuestion(questionId, questionRequestDTO);
            return ResponseEntity.ok(updatedQuestion);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null); // hoặc trả về notFound()
        }
    }

    // Xóa câu hỏi
    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId) {
        try {
            questionService.softDeleteQuestion(questionId);
            return ResponseEntity.noContent().build(); // Trả về 204 No Content
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // Hoặc trả về NotFound
        }
    }
}
