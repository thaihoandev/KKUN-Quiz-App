// GameNotFoundException.java
package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class GameNotFoundException extends GameException {
    public GameNotFoundException(String pinCode) {
        super("Game not found with PIN: " + pinCode, "GAME_NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    public GameNotFoundException(UUID gameId) {
        super("Game not found: " + gameId, "GAME_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}


