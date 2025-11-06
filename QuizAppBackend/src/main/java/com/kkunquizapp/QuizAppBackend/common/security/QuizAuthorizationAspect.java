package com.kkunquizapp.QuizAppBackend.common.security;

import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
public class QuizAuthorizationAspect {

    private final QuizRepo quizRepository;

    /**
     * Kiểm tra quyền chỉnh sửa Quiz
     * Chỉ cho phép host hoặc editor của quiz.
     */
    @Around("@annotation(com.kkunquizapp.QuizAppBackend.common.security.RequireQuizEdit) && args(quizId,..,currentUser)")
    public Object checkQuizEditPermission(
            ProceedingJoinPoint joinPoint,
            UUID quizId,
            UserPrincipal currentUser
    ) throws Throwable {
        if (currentUser == null) {
            throw new AccessDeniedException("User not authenticated");
        }

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        UUID userId = currentUser.getUserId();
        boolean isHost = quiz.getHost() != null && quiz.getHost().getUserId().equals(userId);
        boolean isEditor = quiz.getEditors().stream().anyMatch(u -> u.getUserId().equals(userId));

        if (!isHost && !isEditor) {
            throw new AccessDeniedException("You do not have permission to edit this quiz");
        }

        return joinPoint.proceed();
    }

    /**
     * Kiểm tra quyền xem Quiz
     * Cho phép host, editor, viewer của quiz.
     */
    @Around("@annotation(com.kkunquizapp.QuizAppBackend.common.security.RequireQuizView) && args(quizId,..,currentUser)")
    public Object checkQuizViewPermission(
            ProceedingJoinPoint joinPoint,
            UUID quizId,
            UserPrincipal currentUser
    ) throws Throwable {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        // ✅ Nếu quiz đã publish => cho phép tất cả xem
        if (quiz.getStatus() == com.kkunquizapp.QuizAppBackend.quiz.model.enums.QuizStatus.PUBLISHED) {
            return joinPoint.proceed();
        }

        // Còn lại phải đăng nhập mới xem được
        if (currentUser == null) {
            throw new AccessDeniedException("User not authenticated");
        }

        UUID userId = currentUser.getUserId();
        boolean isHost = quiz.getHost() != null && quiz.getHost().getUserId().equals(userId);
        boolean isEditor = quiz.getEditors().stream().anyMatch(u -> u.getUserId().equals(userId));
        boolean isViewer = quiz.getViewers().stream().anyMatch(u -> u.getUserId().equals(userId));

        if (!isHost && !isEditor && !isViewer) {
            throw new AccessDeniedException("You do not have permission to view this quiz");
        }

        return joinPoint.proceed();
    }

}
