package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class AnonymousNotAllowedException extends GameException {
    public AnonymousNotAllowedException() {
        super("Anonymous players are not allowed in this game", "ANONYMOUS_NOT_ALLOWED", HttpStatus.FORBIDDEN);
    }
}
