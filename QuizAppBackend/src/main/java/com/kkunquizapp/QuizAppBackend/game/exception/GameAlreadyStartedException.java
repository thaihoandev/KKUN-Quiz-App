package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class GameAlreadyStartedException extends GameException {
    public GameAlreadyStartedException() {
        super("Game has already started or ended", "GAME_ALREADY_STARTED", HttpStatus.CONFLICT);
    }
}
