package com.kkunquizapp.QuizAppBackend.service;


import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.UUID;

public interface FileUploadService {
    Map<String, Object> processFile(MultipartFile file, UUID quizId);
    String uploadImageToCloudinary(MultipartFile file);
}
