package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class InvalidPinException extends GameException {
    public InvalidPinException() {
        super("Invalid or expired PIN code", "INVALID_PIN", HttpStatus.BAD_REQUEST);
    }
}
