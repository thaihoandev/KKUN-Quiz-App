package com.kkunquizapp.QuizAppBackend.common.exception;


public class PlayerNotFoundException extends RuntimeException {
    public PlayerNotFoundException(String message) {
        super(message);
    }
}