package com.kkunquizapp.QuizAppBackend.exception;


public class GameNotFoundException extends RuntimeException {
    public GameNotFoundException(String message) {
        super(message);
    }
}