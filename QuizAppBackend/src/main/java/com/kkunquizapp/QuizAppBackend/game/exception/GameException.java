package com.kkunquizapp.QuizAppBackend.game.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base exception cho toàn bộ module Game
 */
@Getter
public class GameException extends RuntimeException {

    private final String code;
    private final HttpStatus httpStatus;

    // 1. Constructor cơ bản
    public GameException(String message) {
        this(message, "GAME_ERROR", HttpStatus.BAD_REQUEST);
    }

    // 2. Với code + message
    public GameException(String message, String code) {
        this(message, code, HttpStatus.BAD_REQUEST);
    }

    // 3. Với message + status
    public GameException(String message, HttpStatus httpStatus) {
        this(message, "GAME_ERROR", httpStatus);
    }

    // 4. Đầy đủ: message + code + status
    public GameException(String message, String code, HttpStatus httpStatus) {
        super(message);
        this.code = code != null ? code : "GAME_ERROR";
        this.httpStatus = httpStatus != null ? httpStatus : HttpStatus.BAD_REQUEST;
    }

    // 5. Đầy đủ + cause (QUAN TRỌNG – fix lỗi bạn gặp)
    public GameException(String message, String code, HttpStatus httpStatus, Throwable cause) {
        super(message, cause);
        this.code = code != null ? code : "GAME_ERROR";
        this.httpStatus = httpStatus != null ? httpStatus : HttpStatus.BAD_REQUEST;
    }

    // 6. Chỉ có cause (hiếm dùng)
    public GameException(Throwable cause) {
        this("An error occurred in game module", "GAME_ERROR", HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }
}