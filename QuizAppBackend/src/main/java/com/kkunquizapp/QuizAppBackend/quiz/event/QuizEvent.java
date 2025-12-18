package com.kkunquizapp.QuizAppBackend.quiz.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record QuizEvent(
        UUID quizId,
        String action,           // "QUIZ_CREATED", "QUIZ_PUBLISHED", "QUIZ_DELETED", ...
        UUID userId,
        LocalDateTime timestamp
) {
    public QuizEvent(UUID quizId, String action, UUID userId) {
        this(quizId, action, userId, LocalDateTime.now());
    }
}