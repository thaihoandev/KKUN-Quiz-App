package com.kkunquizapp.QuizAppBackend.quiz.model;

import com.kkunquizapp.QuizAppBackend.quiz.model.enums.SessionMode;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.SessionStatus;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Table(
        name = "quiz_sessions",
        indexes = {
                @Index(name = "idx_quiz_sessions_user_created", columnList = "user_id, started_at DESC"),
                @Index(name = "idx_quiz_sessions_quiz", columnList = "quiz_id"),
                @Index(name = "idx_quiz_sessions_mode", columnList = "mode")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSession {

    @Id
    @GeneratedValue
    private UUID sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionMode mode;

    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @Column(columnDefinition = "JSONB")
    private String settingsJson;

    @Column(name = "started_at")
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    private UUID assignedBy;

    private UUID guestToken;
    private String guestNickname;
    private String guestAvatar;
    private LocalDateTime guestExpiresAt;

    private int score = 0;
    private int correctAnswers = 0;
    private int totalQuestions;
    private int timeSpentSeconds = 0;
    private double percentage = 0.0;

    private boolean isSubmitted = false;
    private int reviewCount = 0;
}
