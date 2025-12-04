package com.kkunquizapp.QuizAppBackend.common.exception;

import com.kkunquizapp.QuizAppBackend.common.dto.ErrorResponse;
import com.kkunquizapp.QuizAppBackend.game.exception.*;
import com.kkunquizapp.QuizAppBackend.question.exception.QuestionNotFoundException;
import com.kkunquizapp.QuizAppBackend.quiz.exception.QuizNotFoundException;
import com.kkunquizapp.QuizAppBackend.quiz.exception.UnauthorizedException;
import com.kkunquizapp.QuizAppBackend.quiz.exception.ValidationException;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // =============================================================================
    // 1. GAME MODULE EXCEPTIONS (mới thêm)
    // =============================================================================

    @ExceptionHandler(GameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleGameNotFound(GameNotFoundException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(GameAlreadyStartedException.class)
    public ResponseEntity<ErrorResponse> handleGameAlreadyStarted(GameAlreadyStartedException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, request);
    }

    @ExceptionHandler(GameFullException.class)
    public ResponseEntity<ErrorResponse> handleGameFull(GameFullException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(InvalidPinException.class)
    public ResponseEntity<ErrorResponse> handleInvalidPin(InvalidPinException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(NotHostException.class)
    public ResponseEntity<ErrorResponse> handleNotHost(NotHostException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(ParticipantNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleParticipantNotFound(ParticipantNotFoundException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(AlreadyAnsweredException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyAnswered(AlreadyAnsweredException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, request);
    }

    @ExceptionHandler(QuestionTimeoutException.class)
    public ResponseEntity<ErrorResponse> handleQuestionTimeout(QuestionTimeoutException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.GONE, request);
    }

    @ExceptionHandler(GameAlreadyEndedException.class)
    public ResponseEntity<ErrorResponse> handleGameAlreadyEnded(GameAlreadyEndedException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, request);
    }

    @ExceptionHandler(AnonymousNotAllowedException.class)
    public ResponseEntity<ErrorResponse> handleAnonymousNotAllowed(AnonymousNotAllowedException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(InvalidGameStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidGameState(InvalidGameStateException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, request);
    }

    // Fallback cho tất cả GameException (nếu có custom message + code)
    @ExceptionHandler(GameException.class)
    public ResponseEntity<ErrorResponse> handleGenericGameException(GameException ex, WebRequest request) {
        HttpStatus status = ex.getHttpStatus() != null ? ex.getHttpStatus() : HttpStatus.BAD_REQUEST;
        return buildErrorResponse(ex.getMessage(), status, request);
    }

    // =============================================================================
    // 2. CÁC EXCEPTION KHÁC (giữ nguyên + tối ưu)
    // =============================================================================

    @ExceptionHandler({QuizNotFoundException.class, QuestionNotFoundException.class, EntityNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleNotFoundExceptions(RuntimeException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler({ValidationException.class, com.kkunquizapp.QuizAppBackend.question.exception.ValidationException.class})
    public ResponseEntity<ErrorResponse> handleValidationExceptions(RuntimeException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(DuplicateEntityException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEntity(DuplicateEntityException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, request);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, request);
    }

    // =============================================================================
    // 3. Validation @Valid errors
    // =============================================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage()));

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .message("Validation failed")
                .path(extractPath(request))
                .details(fieldErrors)
                .build();

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // =============================================================================
    // 4. Global fallback
    // =============================================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllUncaughtException(Exception ex, WebRequest request) {
        log.error("Unexpected error occurred", ex);
        return buildErrorResponse("An unexpected error occurred. Please try again later.",
                HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    // =============================================================================
    // Helper method – DRY
    // =============================================================================

    private ResponseEntity<ErrorResponse> buildErrorResponse(String message, HttpStatus status, WebRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .message(message)
                .path(extractPath(request))
                .build();
        return new ResponseEntity<>(errorResponse, status);
    }

    private String extractPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}