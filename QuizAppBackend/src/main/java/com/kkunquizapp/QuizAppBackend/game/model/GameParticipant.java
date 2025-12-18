package com.kkunquizapp.QuizAppBackend.game.model;

import com.kkunquizapp.QuizAppBackend.game.model.enums.ParticipantStatus;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "game_participants", indexes = {
        @Index(name = "idx_participant_game", columnList = "game_id"),
        @Index(name = "idx_participant_user", columnList = "user_id"),
        @Index(name = "idx_participant_nickname", columnList = "nickname"),
        @Index(name = "idx_participant_guest_token", columnList = "guestToken"),
        @Index(name = "idx_participant_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID participantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false)
    @Builder.Default
    private boolean isAnonymous = true;

    @Column(length = 100)
    private String connectionId;

    @Column(length = 50)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    // Performance tracking
    @Column(nullable = false)
    @Builder.Default
    private int score = 0;

    @Column(nullable = false)
    @Builder.Default
    private int correctCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int incorrectCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int skippedCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private long totalTimeMs = 0L;

    @Column(nullable = false)
    @Builder.Default
    private long averageResponseTimeMs = 0L;

    @Column(nullable = false)
    @Builder.Default
    private int currentStreak = 0;

    @Column(nullable = false)
    @Builder.Default
    private int bestStreak = 0;

    @Column
    private Integer finalRank;

    @Column(nullable = false)
    @Builder.Default
    private boolean isKicked = false;

    @Column(length = 500)
    private String kickReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ParticipantStatus status = ParticipantStatus.JOINED;

    @Column(length = 36, unique = true)
    private String guestToken;

    private LocalDateTime guestExpiresAt;

    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserAnswer> answers = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    private LocalDateTime leftAt;
    private LocalDateTime lastSeenAt;

    // Helper methods
    public void updateScore(int points) {
        this.score += points;
    }

    public void recordCorrectAnswer(long responseTime) {
        this.correctCount++;
        this.currentStreak++;
        this.totalTimeMs += responseTime;
        long answered = this.correctCount + this.incorrectCount;
        this.averageResponseTimeMs = answered > 0 ? this.totalTimeMs / answered : 0;

        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
        }
    }

    public void recordIncorrectAnswer(long responseTime) {
        this.incorrectCount++;
        this.currentStreak = 0;
        this.totalTimeMs += responseTime;
        long answered = this.correctCount + this.incorrectCount;
        this.averageResponseTimeMs = answered > 0 ? this.totalTimeMs / answered : 0;
    }

    public void recordSkip() {
        this.skippedCount++;
        this.currentStreak = 0;
    }

    public void kick(String reason) {
        this.isKicked = true;
        this.kickReason = reason;
        this.status = ParticipantStatus.KICKED;
        this.leftAt = LocalDateTime.now();
    }

    public void leave() {
        this.status = ParticipantStatus.LEFT;
        this.leftAt = LocalDateTime.now();
    }

    public void complete() {
        this.status = ParticipantStatus.COMPLETED;
    }

    public boolean isActive() {
        return this.status == ParticipantStatus.JOINED || this.status == ParticipantStatus.PLAYING;
    }
}