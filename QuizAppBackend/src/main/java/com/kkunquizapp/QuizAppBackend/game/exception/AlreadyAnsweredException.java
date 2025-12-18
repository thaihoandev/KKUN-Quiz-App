package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class AlreadyAnsweredException extends GameException {
    public AlreadyAnsweredException() {
        super("You have already answered this question", "ALREADY_ANSWERED", HttpStatus.CONFLICT);
    }
}
