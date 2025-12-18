package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class InvalidGameStateException extends GameException {
    public InvalidGameStateException(String currentState) {
        super("Invalid game state: " + currentState, "INVALID_STATE", HttpStatus.CONFLICT);
    }
}
