package com.kkunquizapp.QuizAppBackend.fileUpload.controller;

import com.kkunquizapp.QuizAppBackend.fileUpload.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files/upload")
public class FileUploadController {
    @Autowired
    private FileUploadService fileUploadService;

    @PostMapping("/quizzes/{quizId}")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @PathVariable UUID quizId,@RequestParam("file") MultipartFile file,@RequestHeader(value = "Authorization", required = true) String authorization) {  // ✅ Accept quizId from request
        Map<String, Object> response = fileUploadService.processFile(file, quizId);
        return ResponseEntity.ok(response);
    }
}
