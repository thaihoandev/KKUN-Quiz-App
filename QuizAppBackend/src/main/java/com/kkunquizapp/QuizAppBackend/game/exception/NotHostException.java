package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

/**
 * Ném khi người dùng cố thực hiện hành động chỉ host mới được phép
 * Ví dụ: startGame(), endGame(), kickParticipant(), moveToNextQuestion()...
 */
public class NotHostException extends GameException {

    private static final String DEFAULT_MESSAGE = "Only the host can perform this action";
    private static final String ERROR_CODE = "NOT_HOST";
    private static final HttpStatus STATUS = HttpStatus.FORBIDDEN;

    public NotHostException() {
        super(DEFAULT_MESSAGE, ERROR_CODE, STATUS);
    }

    public NotHostException(String message) {
        super(message, ERROR_CODE, STATUS);
    }

    public NotHostException(String message, Throwable cause) {
        super(message, ERROR_CODE, STATUS, cause);
    }

    public NotHostException(Throwable cause) {
        super(DEFAULT_MESSAGE, ERROR_CODE, STATUS, cause);
    }
}