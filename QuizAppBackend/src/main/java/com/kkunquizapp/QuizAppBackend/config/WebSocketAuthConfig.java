package com.kkunquizapp.QuizAppBackend.config;

import com.kkunquizapp.QuizAppBackend.service.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
public class WebSocketAuthConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtService jwtService; // service của bạn

    public WebSocketAuthConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (acc == null) return message;

                // Khi CONNECT, lấy JWT từ header
                if (acc.getCommand() == StompCommand.CONNECT) {
                    String auth = first(acc.getNativeHeader("Authorization"));
                    if (auth != null && auth.startsWith("Bearer ")) {
                        try {
                            String token = auth.substring(7);
                            // Tự dùng JwtService của bạn để lấy userId
                            String userId = (String) jwtService.getUserInfoFromToken(token).get("userId");
                            // Gán Principal với name = userId
                            acc.setUser(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
                        } catch (Exception ignored) {}
                    }
                }
                return message;
            }

            private String first(List<String> list) { return (list == null || list.isEmpty()) ? null : list.get(0); }
        });
    }
}
