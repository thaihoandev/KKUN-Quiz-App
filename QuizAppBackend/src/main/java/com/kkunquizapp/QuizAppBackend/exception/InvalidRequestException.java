package com.kkunquizapp.QuizAppBackend.exception;


public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
