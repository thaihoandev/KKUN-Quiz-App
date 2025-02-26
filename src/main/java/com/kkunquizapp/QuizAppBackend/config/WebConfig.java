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
                .addPathPatterns("/users/**","/quizzes/**") // Áp dụng cho tất cả các endpoint, bao gồm cả cấp con
                .excludePathPatterns("/auth/**", "/oauth2/**", "/games/join"); // Loại trừ các endpoint không cần xác thực

        registry.addInterceptor(quizPermissionInterceptor)
                .addPathPatterns("/quizzes/**","/questions/**")
                .excludePathPatterns("/quizzes/create");
    }
}
