package com.kkunquizapp.QuizAppBackend.common.exception;

public class QuizNotFoundException extends RuntimeException {
    public QuizNotFoundException(String message) {
        super(message);
    }
}