package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
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

    // Lấy thông tin câu hỏi cụ thể trong quiz
//    @GetMapping("/{questionId}")
//    public ResponseEntity<QuestionResponseDTO> getQuestion(
//            @PathVariable UUID quizId,
//            @PathVariable UUID questionId) {
//        try {
//            QuestionResponseDTO responseDTO = questionService.getQuestion(quizId, questionId);
//            return ResponseEntity.ok(responseDTO);
//        } catch (Exception e) {
//            return ResponseEntity.notFound().build();
//        }
//    }
}
