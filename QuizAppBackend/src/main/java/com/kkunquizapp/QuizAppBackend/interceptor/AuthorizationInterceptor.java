package com.kkunquizapp.QuizAppBackend.interceptor;

import com.kkunquizapp.QuizAppBackend.model.Quiz;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;
import java.util.UUID;

@Component
public class AuthorizationInterceptor implements HandlerInterceptor {

    private final QuizRepo quizRepository;

    public AuthorizationInterceptor(QuizRepo quizRepository) {
        this.quizRepository = quizRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Lấy thông tin currentUserId từ header hoặc attribute
        String currentUserId = (String) request.getAttribute("currentUserId");
        if (currentUserId == null) {
            currentUserId = request.getHeader("currentUserId");
        }

        // Trích xuất quizId từ URL
        String requestURI = request.getRequestURI();
        String quizId = extractQuizIdFromURI(requestURI);

        // Kiểm tra nếu thiếu thông tin
        if (currentUserId == null || quizId == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("Missing currentUserId or quizId");
            return false;
        }

        try {
            // Kiểm tra quyền
            UUID quizUUID = UUID.fromString(quizId);
            Optional<Quiz> optionalQuiz = quizRepository.findById(quizUUID);

            if (optionalQuiz.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write("Quiz not found");
                return false;
            }

            Quiz quiz = optionalQuiz.get();

            if (!quiz.getHost().getUserId().toString().equals(currentUserId)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("You are not authorized to modify this quiz.");
                return false;
            }

            // Nếu hợp lệ, cho phép tiếp tục
            return true;
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("Invalid quizId format: " + e.getMessage());
            return false;
        }
    }

    // Hàm trích xuất quizId từ URI
    private String extractQuizIdFromURI(String uri) {
        // Chia nhỏ URI thành các phần tử
        String[] segments = uri.split("/");

        // Duyệt qua các phần tử để tìm "quizzes"
        for (int i = 0; i < segments.length; i++) {
            if ("quizzes".equals(segments[i]) && i + 1 < segments.length) {
                String possibleQuizId = segments[i + 1];
                // Kiểm tra xem "quizId" có phải UUID hợp lệ không
                try {
                    UUID.fromString(possibleQuizId);
                    return possibleQuizId; // Nếu hợp lệ, trả về quizId
                } catch (IllegalArgumentException e) {
                    // Bỏ qua nếu không phải UUID hợp lệ
                }
            }
        }
        return null; // Không tìm thấy quizId hợp lệ
    }




}
