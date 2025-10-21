package com.kkunquizapp.QuizAppBackend.common.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Giới hạn 3 lần / 10 phút / user cho POST /api/users/me/request-email-otp
 * (Đổi path bên dưới nếu bạn dùng /request-email-change)
 */
@Component
@Order(10)
public class EmailOtpRateLimitFilter implements Filter {

    private final StringRedisTemplate redis;

    private static final int LIMIT = 3;
    private static final Duration WINDOW = Duration.ofMinutes(10);

    public EmailOtpRateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    private String keyFor(HttpServletRequest req) {
        String principal = req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : null;
        String id = (principal != null) ? "u:" + principal : "ip:" + req.getRemoteAddr();
        return "rl:emailOtp:" + id;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        if ("POST".equalsIgnoreCase(req.getMethod())
                && "/api/users/me/request-email-otp".equals(req.getRequestURI())) {

            String key = keyFor(req);

            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, WINDOW.getSeconds(), TimeUnit.SECONDS);
            }

            if (count != null && count > LIMIT) {
                res.setStatus(429);
                res.setContentType("text/plain;charset=UTF-8");
                res.getWriter().write("Too many requests. Please try again later.");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
