package com.kkunquizapp.QuizAppBackend.chatBot.controller;

import com.kkunquizapp.QuizAppBackend.chatBot.dto.TopicGenerateRequest;
import com.kkunquizapp.QuizAppBackend.chatBot.service.GeminiService;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * ✅ IMPROVED GeminiController v2
 * - Async-first design
 * - Proper job lifecycle management
 * - Auto cleanup (1 hour)
 * - Better error handling
 */
@RestController
@RequiredArgsConstructor
@Validated
@Slf4j
@RequestMapping(path = "/api/ai", produces = MediaType.APPLICATION_JSON_VALUE)
public class GeminiController {

    private final GeminiService geminiService;

    // ✅ Job cache with expiration
    private static final Map<String, GenerationJob> JOB_CACHE = new ConcurrentHashMap<>();
    private static final long JOB_EXPIRATION_MS = TimeUnit.HOURS.toMillis(1);
    private static final Timer CLEANUP_TIMER = new Timer("GeminiJobCleanup", true);

    static {
        // Start cleanup task every 10 minutes
        CLEANUP_TIMER.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                long now = System.currentTimeMillis();
                JOB_CACHE.entrySet().removeIf(entry ->
                        now - entry.getValue().createdAt > JOB_EXPIRATION_MS
                );
                log.debug("🧹 Cleaned expired jobs. Remaining: {}", JOB_CACHE.size());
            }
        }, JOB_EXPIRATION_MS, 10 * 60 * 1000);
    }

    // ==================== DEPRECATED: SYNC ENDPOINT ====================
    /**
     * ❌ NOT RECOMMENDED - Can timeout for large requests
     *
     * @deprecated Use generateByTopicAsync instead
     */
    @PostMapping(value = "/questions/generate-by-topic", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Deprecated(since = "2.0", forRemoval = true)
    public ResponseEntity<List<QuestionResponseDTO>> generateByTopic(
            @RequestBody TopicGenerateRequest request
    ) {
        log.warn("⚠️ DEPRECATED endpoint called. Use /generate-by-topic-async instead.");
        try {
            List<QuestionResponseDTO> result = geminiService.generateByTopic(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ Sync generation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    // ==================== RECOMMENDED: ASYNC ENDPOINT ====================
    /**
     * ✅ START async question generation
     *
     * POST /api/ai/questions/generate-by-topic-async
     *
     * @param request TopicGenerateRequest with topic, count, language, etc.
     * @return { jobId, status: "accepted", message }
     *
     * USAGE:
     * 1. Call this endpoint to start generation
     * 2. Poll /api/ai/questions/status/{jobId} until status = "completed" or "failed"
     * 3. Retrieve questions from status response
     */
    @PostMapping(value = "/questions/generate-by-topic-async", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> generateByTopicAsync(
            @RequestBody TopicGenerateRequest request
    ) {
        // Validation
        if (request.getTopic() == null || request.getTopic().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Topic is required",
                            "code", "INVALID_TOPIC"
                    ));
        }

        if (request.getCount() == null || request.getCount() < 1 || request.getCount() > 25) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Count must be between 1 and 25",
                            "code", "INVALID_COUNT"
                    ));
        }

        String jobId = UUID.randomUUID().toString();
        GenerationJob job = new GenerationJob(jobId, request);

        log.info("📋 Job {} created - topic: {}, count: {}",
                jobId, request.getTopic(), request.getCount());

        // Start async generation
        geminiService.generateByTopicAsync(request)
                .thenAccept(questions -> {
                    job.status = "completed";
                    job.questions = questions;
                    job.completedAt = System.currentTimeMillis();
                    JOB_CACHE.put(jobId, job);
                    log.info("✅ Job {} completed: {} questions", jobId, questions.size());
                })
                .exceptionally(e -> {
                    job.status = "failed";
                    job.error = e.getMessage() != null ? e.getMessage() : "Unknown error";
                    job.completedAt = System.currentTimeMillis();
                    JOB_CACHE.put(jobId, job);
                    log.error("❌ Job {} failed: {}", jobId, job.error);
                    return null;
                });

        // Add to cache
        JOB_CACHE.put(jobId, job);

        return ResponseEntity.accepted()
                .body(Map.of(
                        "jobId", jobId,
                        "status", "accepted",
                        "message", "Generation started. Poll /api/ai/questions/status/" + jobId,
                        "pollUrl", "/api/ai/questions/status/" + jobId
                ));
    }

    // ==================== STATUS POLLING ====================
    /**
     * ✅ GET job status and results
     *
     * GET /api/ai/questions/status/{jobId}
     *
     * Returns:
     * - status: "processing" | "completed" | "failed"
     * - questions: [...] (when completed)
     * - error: "..." (when failed)
     * - progress: { attempted, current, target } (estimated)
     */
    @GetMapping(value = "/questions/status/{jobId}")
    public ResponseEntity<Map<String, Object>> getGenerationStatus(
            @PathVariable String jobId
    ) {
        GenerationJob job = JOB_CACHE.get(jobId);

        if (job == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "Job not found or expired",
                            "jobId", jobId,
                            "code", "JOB_NOT_FOUND"
                    ));
        }

        return ResponseEntity.ok(job.toResponse());
    }

    // ==================== CANCEL JOB ====================
    /**
     * ✅ CANCEL and cleanup job
     *
     * DELETE /api/ai/questions/status/{jobId}
     */
    @DeleteMapping(value = "/questions/status/{jobId}")
    public ResponseEntity<Map<String, String>> cancelJob(
            @PathVariable String jobId
    ) {
        GenerationJob removed = JOB_CACHE.remove(jobId);

        if (removed == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "Job not found",
                            "jobId", jobId
                    ));
        }

        log.info("🛑 Job {} cancelled", jobId);
        return ResponseEntity.ok(Map.of(
                "jobId", jobId,
                "message", "Job cancelled and removed",
                "status", "cancelled"
        ));
    }

    // ==================== JOB LISTING ====================
    /**
     * ✅ LIST all active jobs
     *
     * GET /api/ai/questions/jobs
     */
    @GetMapping(value = "/questions/jobs")
    public ResponseEntity<Map<String, Object>> listJobs() {
        List<Map<String, Object>> jobs = JOB_CACHE.values().stream()
                .map(job -> Map.of(
                        "jobId", (Object) job.jobId,
                        "topic", job.request.getTopic(),
                        "status", job.status,
                        "createdAt", new Date(job.createdAt),
                        "progress", job.questions != null ? job.questions.size() : 0
                ))
                .toList();

        return ResponseEntity.ok(Map.of(
                "totalJobs", JOB_CACHE.size(),
                "jobs", jobs
        ));
    }

    // ==================== INNER CLASS ====================

    /**
     * Generation job state holder
     */
    public static class GenerationJob {
        public String jobId;
        public String status = "processing";  // processing | completed | failed
        public List<QuestionResponseDTO> questions;
        public String error;
        public long createdAt;
        public long completedAt;
        public TopicGenerateRequest request;

        public GenerationJob(String jobId, TopicGenerateRequest request) {
            this.jobId = jobId;
            this.request = request;
            this.createdAt = System.currentTimeMillis();
        }

        /**
         * Convert to API response
         */
        public Map<String, Object> toResponse() {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("jobId", jobId);
            response.put("status", status);
            response.put("createdAt", new Date(createdAt));

            if ("completed".equals(status)) {
                response.put("questions", questions);
                response.put("count", questions != null ? questions.size() : 0);
                response.put("completedAt", new Date(completedAt));
                response.put("duration", completedAt - createdAt + "ms");
            } else if ("failed".equals(status)) {
                response.put("error", error);
                response.put("failedAt", new Date(completedAt));
            } else {
                response.put("message", "Still generating... Please wait.");
            }

            return response;
        }
    }
}