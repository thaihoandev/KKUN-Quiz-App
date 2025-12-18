package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class GameAlreadyEndedException extends GameException {
    public GameAlreadyEndedException() {
        super("Game has already ended", "GAME_ENDED", HttpStatus.CONFLICT);
    }
}
