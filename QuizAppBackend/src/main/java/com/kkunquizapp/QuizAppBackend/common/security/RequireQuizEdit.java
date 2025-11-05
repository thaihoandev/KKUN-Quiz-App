package com.kkunquizapp.QuizAppBackend.common.security;

import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// ============================================================================
// ANNOTATION 1: RequireQuizEdit
// ============================================================================

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireQuizEdit {
}

// ============================================================================
// ANNOTATION 2: RequireQuizView
// ============================================================================

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireQuizView {
}

// ============================================================================
// ASPECT: QuizAuthorizationAspect
// ============================================================================

@Aspect
@Component
@RequiredArgsConstructor
class QuizAuthorizationAspect {

    private final QuizRepo quizRepository;
    private final UserService userService;

    @Around("@annotation(com.kkunquizapp.QuizAppBackend.common.security.RequireQuizEdit)")
    public Object checkQuizEditPermission(ProceedingJoinPoint joinPoint) throws Throwable {
        String userId = userService.getCurrentUserId();
        String quizId = extractQuizIdFromRequest();

        if (quizId == null) {
            throw new IllegalArgumentException("Invalid quiz ID in URL");
        }

        Quiz quiz = quizRepository.findById(UUID.fromString(quizId))
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        UUID userUUID = UUID.fromString(userId);
        boolean isHost = quiz.getHost().getUserId().equals(userUUID);
        boolean isEditor = quiz.getEditors().stream()
                .anyMatch(user -> user.getUserId().equals(userUUID));

        if (!isHost && !isEditor) {
            throw new AccessDeniedException("You do not have permission to edit this quiz");
        }

        return joinPoint.proceed();
    }

    @Around("@annotation(com.kkunquizapp.QuizAppBackend.common.security.RequireQuizView)")
    public Object checkQuizViewPermission(ProceedingJoinPoint joinPoint) throws Throwable {
        String userId = userService.getCurrentUserId();
        String quizId = extractQuizIdFromRequest();

        if (quizId == null) {
            throw new IllegalArgumentException("Invalid quiz ID in URL");
        }

        Quiz quiz = quizRepository.findById(UUID.fromString(quizId))
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        UUID userUUID = UUID.fromString(userId);
        boolean isHost = quiz.getHost().getUserId().equals(userUUID);
        boolean isEditor = quiz.getEditors().stream()
                .anyMatch(user -> user.getUserId().equals(userUUID));
        boolean isViewer = quiz.getViewers().stream()
                .anyMatch(user -> user.getUserId().equals(userUUID));

        if (!isHost && !isEditor && !isViewer) {
            throw new AccessDeniedException("You do not have permission to view this quiz");
        }

        return joinPoint.proceed();
    }

    private String extractQuizIdFromRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;

        String uri = attrs.getRequest().getRequestURI();
        Pattern pattern = Pattern.compile("/quizzes/([a-f0-9-]{36})");
        Matcher matcher = pattern.matcher(uri);

        return matcher.find() ? matcher.group(1) : null;
    }
}
