package com.kkunquizapp.QuizAppBackend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Data
@Table(name = "player")
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(updatable = false, nullable = false, unique = true)
    private UUID playerId;

    @ManyToOne
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(name = "user_id", nullable = true)
    private UUID userId; // Lưu UUID thay vì object User

    @Column(nullable = false, length = 100)
    private String nickname;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private boolean isAnonymous;

    private boolean isInGame = true;
    // Getters and Setters
}

