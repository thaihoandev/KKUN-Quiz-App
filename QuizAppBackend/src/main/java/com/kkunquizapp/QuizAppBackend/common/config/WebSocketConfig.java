package com.kkunquizapp.QuizAppBackend.common.config;

import com.kkunquizapp.QuizAppBackend.common.interceptor.JwtHandshakeInterceptor;
import com.kkunquizapp.QuizAppBackend.common.interceptor.UserIdPrincipalHandshakeHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.*;

import java.security.Principal;

/**
 * WebSocket Configuration for Real-time Game Communication
 *
 * Features:
 * - JWT authentication via cookie
 * - User-specific messaging
 * - Connection lifecycle logging
 * - Heartbeat configuration
 * - Thread pool optimization
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final UserIdPrincipalHandshakeHandler userIdPrincipalHandshakeHandler;

    /**
     * Register WebSocket endpoints
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // Add JWT interceptor to extract userId from cookie
                .addInterceptors(jwtHandshakeInterceptor)
                // Set Principal to userId for user-specific messaging
                .setHandshakeHandler(userIdPrincipalHandshakeHandler)
                // Allow all origins (configure properly in production)
                .setAllowedOriginPatterns("*")
                // Enable SockJS fallback for browsers without WebSocket support
                .withSockJS()
                // SockJS configuration
                .setHeartbeatTime(25000) // Send heartbeat every 25s
                .setDisconnectDelay(5000) // Wait 5s before disconnecting
                .setStreamBytesLimit(512 * 1024) // 512KB max message size
                .setHttpMessageCacheSize(1000); // Cache 1000 messages

        // Alternative endpoint without SockJS (for native WebSocket clients)
        registry.addEndpoint("/ws")
                .addInterceptors(jwtHandshakeInterceptor)
                .setHandshakeHandler(userIdPrincipalHandshakeHandler)
                .setAllowedOriginPatterns("*");

        log.info("WebSocket endpoints registered at /ws");
    }

    /**
     * Configure message broker
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple in-memory broker for pub/sub
        registry.enableSimpleBroker("/topic", "/queue")
                // Set heartbeat: [server-to-client, client-to-server] in milliseconds
                .setHeartbeatValue(new long[]{25000, 25000})
                // Task scheduler for heartbeat
                .setTaskScheduler(createTaskScheduler());

        // Prefix for messages FROM client TO server
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific messages
        registry.setUserDestinationPrefix("/user");

        log.info("Message broker configured: /topic, /queue, /user");
    }

    /**
     * Configure client inbound channel
     * Intercept messages from client
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

                if (accessor != null) {
                    StompCommand command = accessor.getCommand();
                    Principal user = accessor.getUser();

                    // Log connection lifecycle
                    if (StompCommand.CONNECT.equals(command)) {
                        String sessionId = accessor.getSessionId();
                        String userId = user != null ? user.getName() : "anonymous";
                        log.info("WebSocket CONNECT - Session: {}, User: {}", sessionId, userId);

                    } else if (StompCommand.DISCONNECT.equals(command)) {
                        String sessionId = accessor.getSessionId();
                        String userId = user != null ? user.getName() : "anonymous";
                        log.info("WebSocket DISCONNECT - Session: {}, User: {}", sessionId, userId);

                    } else if (StompCommand.SUBSCRIBE.equals(command)) {
                        String destination = accessor.getDestination();
                        String sessionId = accessor.getSessionId();
                        log.debug("WebSocket SUBSCRIBE - Session: {}, Destination: {}",
                                sessionId, destination);

                    } else if (StompCommand.UNSUBSCRIBE.equals(command)) {
                        String subscriptionId = accessor.getSubscriptionId();
                        log.debug("WebSocket UNSUBSCRIBE - Subscription: {}", subscriptionId);
                    }
                }

                return message;
            }

            @Override
            public void afterSendCompletion(Message<?> message, MessageChannel channel,
                                            boolean sent, Exception ex) {
                if (ex != null) {
                    log.error("Error sending WebSocket message: {}", ex.getMessage());
                }
            }
        });

        // Configure thread pool for inbound messages
        registration.taskExecutor()
                .corePoolSize(10)
                .maxPoolSize(50)
                .queueCapacity(1000);

        log.info("Client inbound channel configured with thread pool");
    }

    /**
     * Configure client outbound channel
     * Intercept messages TO client
     */
    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

                if (accessor != null && StompCommand.MESSAGE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    log.trace("WebSocket SEND - Destination: {}", destination);
                }

                return message;
            }
        });

        // Configure thread pool for outbound messages
        registration.taskExecutor()
                .corePoolSize(10)
                .maxPoolSize(50)
                .queueCapacity(1000);

        log.info("Client outbound channel configured with thread pool");
    }

    /**
     * Create task scheduler for heartbeat
     */
    private ThreadPoolTaskScheduler createTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(10);
        scheduler.initialize();
        return scheduler;
    }
}