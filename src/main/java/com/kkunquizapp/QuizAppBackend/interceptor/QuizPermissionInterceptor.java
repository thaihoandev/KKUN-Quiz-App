package com.kkunquizapp.QuizAppBackend.interceptor;

import com.kkunquizapp.QuizAppBackend.model.Quiz;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import com.kkunquizapp.QuizAppBackend.service.JwtService;
import com.kkunquizapp.QuizAppBackend.service.QuizService;
import com.kkunquizapp.QuizAppBackend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class QuizPermissionInterceptor implements HandlerInterceptor {
    private final QuizService quizService;
    private final UserService userService;
    private final QuizRepo quizRepository;
    @Autowired
    private JwtService jwtService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String token = request.getHeader("Authorization");

        if (token == null || !token.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing or invalid Authorization header");
            return false;
        }

        token = token.substring(7); // Loại bỏ "Bearer " khỏi token
        String currentUserId = jwtService.getUserIdFromToken(token); // Lấy userId từ token

        String requestURI = request.getRequestURI();
        String quizId = extractQuizIdFromURI(requestURI);

        if (currentUserId == null || quizId == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("Missing currentUserId or quizId");
            return false;
        }

        UUID quizUUID = UUID.fromString(quizId);
        Optional<Quiz> optionalQuiz = quizRepository.findById(quizUUID);

        if (optionalQuiz.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().write("Quiz not found");
                return false;
        }

        Quiz quiz = optionalQuiz.get();

        UUID userUUID = UUID.fromString(currentUserId);

        // Kiểm tra nếu user là host
        if (quiz.getHost().getUserId().equals(userUUID)) {
            // Nếu là host, cho phép mọi quyền
            return true;
        }

        // Kiểm tra quyền xem
        boolean canView = quiz.getViewers().stream().anyMatch(user -> user.getUserId().equals(userUUID));
        boolean canEdit = quiz.getEditors().stream().anyMatch(user -> user.getUserId().equals(userUUID));

        if (!canEdit) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("You do not have permission to access this quiz");
            return false;
        }

        return true;
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

