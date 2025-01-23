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

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    private User user; // Null if anonymous player

    @Column(nullable = false, length = 100)
    private String nickname;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private boolean isAnonymous;

    // Getters and Setters
}

