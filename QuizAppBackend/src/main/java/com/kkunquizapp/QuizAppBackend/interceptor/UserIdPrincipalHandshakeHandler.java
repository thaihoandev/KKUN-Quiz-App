package com.kkunquizapp.QuizAppBackend.interceptor;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Component
public class UserIdPrincipalHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attrs) {
        String userId = (String) attrs.get("wsUserId");
        return (userId != null)
                ? new UsernamePasswordAuthenticationToken(userId, null, List.of())
                : super.determineUser(request, wsHandler, attrs);
    }
}