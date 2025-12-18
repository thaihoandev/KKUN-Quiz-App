package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class GameFullException extends GameException {
    public GameFullException() {
        super("Game is full. Cannot join.", "GAME_FULL", HttpStatus.FORBIDDEN);
    }
}// InvalidPinException.java
