package com.kkunquizapp.QuizAppBackend.common.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Giới hạn 3 lần / 10 phút / user cho POST /api/users/me/request-email-change
 * (Có thể đổi path sang /request-email-otp nếu bạn đang dùng OTP.)
 */
@Component
@Order(10)
public class EmailChangeRateLimitFilter implements Filter {

    private final StringRedisTemplate redis;

    // 3 lần trong 10 phút
    private static final int LIMIT = 3;
    private static final Duration WINDOW = Duration.ofMinutes(10);

    public EmailChangeRateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    private String keyFor(HttpServletRequest req) {
        String principal = req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : null;
        String id = (principal != null) ? "u:" + principal : "ip:" + req.getRemoteAddr();
        return "rl:emailChange:" + id;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        if ("POST".equalsIgnoreCase(req.getMethod())
                && "/api/users/me/request-email-change".equals(req.getRequestURI())) {
            String key = keyFor(req);

            // INCR
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                // lần đầu -> đặt TTL cửa sổ
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
