package com.kkunquizapp.QuizAppBackend.game.model;

import com.kkunquizapp.QuizAppBackend.question.model.Question;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_answers", indexes = {
        @Index(name = "idx_answer_game", columnList = "game_id"),
        @Index(name = "idx_answer_participant", columnList = "participant_id"),
        @Index(name = "idx_answer_question", columnList = "question_id"),
        @Index(name = "idx_answer_session", columnList = "sessionId")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID answerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private GameParticipant participant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(length = 36)
    private UUID sessionId;

    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    private String submittedAnswerJson;

    @Column(columnDefinition = "TEXT")
    private String submittedAnswerText;

    // === Grading ===
    @Column(nullable = false)
    @Builder.Default
    private boolean correct = false;

    @Column(nullable = false)
    @Builder.Default
    private int pointsEarned = 0;

    @Column(nullable = false)
    @Builder.Default
    private int maxPoints = 100;

    @Column(nullable = false)
    @Builder.Default
    private double accuracy = 0.0;

    // === Timing ===
    @Column(nullable = false)
    @Builder.Default
    private long responseTimeMs = 0L;

    @Column(nullable = false)
    @Builder.Default
    private boolean isSkipped = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isTimeout = false;

    // === Attempt tracking ===
    @Column(nullable = false)
    @Builder.Default
    private int attemptNumber = 1;

    @Column(nullable = false)
    @Builder.Default
    private int totalAttempts = 1;

    // === Feedback ===
    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    // === Timestamps ===
    private LocalDateTime clientSubmittedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime serverReceivedAt;

    @Column
    private LocalDateTime gradedAt;

    // Helper methods
    public void grade(boolean isCorrect, int points) {
        this.correct = isCorrect;
        this.pointsEarned = points;
        this.accuracy = this.maxPoints > 0 ? (points * 100.0 / this.maxPoints) : 0.0;
        this.gradedAt = LocalDateTime.now();
    }

    public void markAsSkipped() {
        this.isSkipped = true;
        this.correct = false;
        this.pointsEarned = 0;
        this.accuracy = 0.0;
    }

    public void markAsTimeout() {
        this.isTimeout = true;
        this.correct = false;
        this.pointsEarned = 0;
        this.accuracy = 0.0;
    }
}