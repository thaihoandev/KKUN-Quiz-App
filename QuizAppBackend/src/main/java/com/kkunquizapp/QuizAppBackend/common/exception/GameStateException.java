package com.kkunquizapp.QuizAppBackend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class GameStateException extends RuntimeException {
    public GameStateException(String message) {
        super(message);
    }
}