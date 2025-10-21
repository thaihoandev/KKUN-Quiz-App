package com.kkunquizapp.QuizAppBackend.common.exception;


public class DuplicateEntityException extends RuntimeException {
    public DuplicateEntityException(String message) {
        super(message);
    }
}

