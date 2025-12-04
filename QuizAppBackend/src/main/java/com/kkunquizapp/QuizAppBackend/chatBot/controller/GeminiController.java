package com.kkunquizapp.QuizAppBackend.chatBot.controller;

import com.kkunquizapp.QuizAppBackend.chatBot.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.chatBot.service.GeminiService;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
     * Generate question list by topic
     * POST /api/ai/questions/generate-by-topic
     */
    @PostMapping(value = "/questions/generate-by-topic", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<QuestionResponseDTO>> generateByTopic(
            @RequestBody TopicGenerateRequest request
    ) {
        List<QuestionResponseDTO> result = geminiService.generateByTopic(request);
        return ResponseEntity.ok(result);
    }
}
