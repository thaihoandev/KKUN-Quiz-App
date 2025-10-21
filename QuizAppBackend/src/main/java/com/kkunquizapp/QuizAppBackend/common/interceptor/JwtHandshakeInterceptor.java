package com.kkunquizapp.QuizAppBackend.common.interceptor;

import com.kkunquizapp.QuizAppBackend.auth.service.JwtService;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtService jwtService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                   WebSocketHandler wsHandler, Map<String, Object> attrs) {
        if (req instanceof ServletServerHttpRequest sreq) {
            var cookies = Optional.ofNullable(sreq.getServletRequest().getCookies()).orElse(new Cookie[0]);
            String token = Arrays.stream(cookies)
                    .filter(c -> "accessToken".equals(c.getName())) // ĐÚNG tên cookie của bạn
                    .map(Cookie::getValue)
                    .findFirst().orElse(null);
            if (token != null) {
                String userId = (String) jwtService.getUserInfoFromToken(token).get("userId");
                attrs.put("wsUserId", userId);
            }
        }
        return true;
    }

    @Override public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                         WebSocketHandler wsHandler, Exception ex) {}
}