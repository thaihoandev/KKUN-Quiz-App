package com.kkunquizapp.QuizAppBackend.common.exception;


public class GameNotFoundException extends RuntimeException {
    public GameNotFoundException(String message) {
        super(message);
    }
}