package com.kkunquizapp.QuizAppBackend.exception;


public class PlayerNotFoundException extends RuntimeException {
    public PlayerNotFoundException(String message) {
        super(message);
    }
}