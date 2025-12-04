package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

public class QuestionTimeoutException extends GameException {
    public QuestionTimeoutException() {
        super("Time's up! Question has ended.", "QUESTION_TIMEOUT", HttpStatus.GONE);
    }
}
