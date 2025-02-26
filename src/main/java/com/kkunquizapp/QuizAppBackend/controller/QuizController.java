package com.kkunquizapp.QuizAppBackend.controller;


import com.kkunquizapp.QuizAppBackend.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.service.QuizService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/quizzes")
public class QuizController {
    @Autowired
    private QuizService quizService;

    @GetMapping()
    public ResponseEntity<QuizResponseDTO> getAllQuizzes(
            @PathVariable UUID quizId){
        try {
            QuizResponseDTO responseDTO = quizService.getQuizById(quizId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    //     Lấy thông tin  quiz
    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponseDTO> getQuizById(
            @PathVariable UUID quizId){
        try {
            QuizResponseDTO responseDTO = quizService.getQuizById(quizId);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/create")
    public ResponseEntity<QuizResponseDTO> addQuiz(HttpServletRequest request, @RequestBody QuizRequestDTO quizRequestDTO) {
        try {
            QuizResponseDTO responseDTO = quizService.createQuiz(request,quizRequestDTO);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
    @PutMapping("/{quizId}/edit")
    public ResponseEntity<QuizResponseDTO> editQuiz(@PathVariable    UUID quizId, @RequestBody QuizRequestDTO quizRequestDTO) {
        try {
            QuizResponseDTO responseDTO = quizService.updateQuiz(quizId,quizRequestDTO);
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
    // Thêm viewer bằng email
    @PostMapping("/{quizId}/addViewerByEmail")
    public ResponseEntity<Void> addViewerByEmail(@PathVariable UUID quizId, @RequestParam String email) {
        try {
            quizService.addViewerByEmail(quizId, email);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Thêm editor bằng email
    @PostMapping("/{quizId}/addEditorByEmail")
    public ResponseEntity<Void> addEditorByEmail(@PathVariable UUID quizId, @RequestParam String email) {
        try {
            quizService.addEditorByEmail(quizId, email);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

}
