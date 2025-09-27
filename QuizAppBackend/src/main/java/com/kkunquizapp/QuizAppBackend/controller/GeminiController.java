package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.service.GeminiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping(path = "/api/ai", produces = MediaType.APPLICATION_JSON_VALUE)
public class GeminiController {

    private final GeminiService geminiService;

    /**
     * Sinh danh sách câu hỏi theo chủ đề.
     * POST /api/questions/generate-by-topic
     */
    @PostMapping(value = "/questions/generate-by-topic", consumes = MediaType.APPLICATION_JSON_VALUE)
    public List<QuestionRequestDTO> generateByTopic(@Valid @RequestBody TopicGenerateRequest req) throws Exception {
        // chuẩn hóa dữ liệu (default & clamp) trước khi gọi service
        TopicGenerateRequest normalized = req.normalized();
        return geminiService.generateQuestionsByTopic(normalized);
    }
}
