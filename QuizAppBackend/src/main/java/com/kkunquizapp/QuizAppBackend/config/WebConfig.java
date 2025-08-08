package com.kkunquizapp.QuizAppBackend.config;

import com.kkunquizapp.QuizAppBackend.interceptor.AuthorizationInterceptor;
import com.kkunquizapp.QuizAppBackend.interceptor.JwtInterceptor;
import com.kkunquizapp.QuizAppBackend.interceptor.QuizPermissionInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuthorizationInterceptor authorizationInterceptor;
    private final QuizPermissionInterceptor quizPermissionInterceptor;

    private final JwtInterceptor jwtInterceptor;

    public WebConfig(AuthorizationInterceptor authorizationInterceptor, QuizPermissionInterceptor quizPermissionInterceptor, JwtInterceptor jwtInterceptor) {
        this.authorizationInterceptor = authorizationInterceptor;
        this.quizPermissionInterceptor = quizPermissionInterceptor;
        this.jwtInterceptor = jwtInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Áp dụng JwtInterceptor cho tất cả các endpoint trong /api/**
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/api/users/**", "/api/quizzes/**");
        registry.addInterceptor(quizPermissionInterceptor)
                .addPathPatterns(
                        "/api/quizzes/*/edit",
                        "/api/quizzes/*/delete",
                        "/api/quizzes/*/addViewerByEmail",
                        "/api/quizzes/*/addEditorByEmail",
                        "/api/questions/**",
                        "/api/files/upload/quizzes/**"
                );

    }
}
