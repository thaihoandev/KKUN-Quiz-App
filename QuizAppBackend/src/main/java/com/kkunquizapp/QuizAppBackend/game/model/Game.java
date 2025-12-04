package com.kkunquizapp.QuizAppBackend.game.model;

import com.kkunquizapp.QuizAppBackend.game.model.enums.GameStatus;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "games", indexes = {
        @Index(name = "idx_games_pin", columnList = "pinCode", unique = true),
        @Index(name = "idx_games_host_status", columnList = "host_id, game_status"),
        @Index(name = "idx_games_quiz", columnList = "quiz_id"),
        @Index(name = "idx_games_status", columnList = "game_status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID gameId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false, length = 8, unique = true)
    private String pinCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GameStatus gameStatus = GameStatus.WAITING;

    @Column(columnDefinition = "JSONB")
    private String settingsJson;

    @Column(nullable = false)
    @Builder.Default
    private Integer maxPlayers = 200;

    @Column(nullable = false)
    @Builder.Default
    private boolean allowAnonymous = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean showLeaderboard = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean randomizeQuestions = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean randomizeOptions = false;

    private UUID currentQuestionId;

    @Column(nullable = false)
    @Builder.Default
    private int currentQuestionIndex = -1;

    private LocalDateTime questionStartTime;

    @Column(nullable = false)
    @Builder.Default
    private int totalQuestions = 0;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime lastActivityAt;

    @Column(nullable = false)
    @Builder.Default
    private int playerCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int activePlayerCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int completedPlayerCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private double averageScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private long totalGameTimeMs = 0L;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<GameParticipant> participants = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Helper methods
    public void incrementPlayerCount() {
        this.playerCount++;
    }

    public void decrementPlayerCount() {
        if (this.playerCount > 0) this.playerCount--;
    }

    public void startGame() {
        this.gameStatus = GameStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
        this.lastActivityAt = LocalDateTime.now();
    }

    public void endGame() {
        this.gameStatus = GameStatus.FINISHED;
        this.endedAt = LocalDateTime.now();
        if (startedAt != null) {
            this.totalGameTimeMs = java.time.Duration.between(startedAt, endedAt).toMillis();
        }
    }

    public void moveToNextQuestion() {
        this.currentQuestionIndex++;
        this.questionStartTime = LocalDateTime.now();
        this.lastActivityAt = LocalDateTime.now();
    }

    public boolean isGameActive() {
        return this.gameStatus == GameStatus.IN_PROGRESS;
    }

    public boolean canJoin() {
        return this.gameStatus == GameStatus.WAITING && this.playerCount < this.maxPlayers;
    }
}