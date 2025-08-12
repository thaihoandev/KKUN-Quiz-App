package com.kkunquizapp.QuizAppBackend.config;

import com.kkunquizapp.QuizAppBackend.interceptor.JwtHandshakeInterceptor;
import com.kkunquizapp.QuizAppBackend.interceptor.UserIdPrincipalHandshakeHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final UserIdPrincipalHandshakeHandler userIdPrincipalHandshakeHandler;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .addInterceptors(jwtHandshakeInterceptor) // đọc cookie ở đây
                .setHandshakeHandler(userIdPrincipalHandshakeHandler) // set Principal = userId
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue"); // broker nội bộ
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user"); // để dùng convertAndSendToUser
    }
}