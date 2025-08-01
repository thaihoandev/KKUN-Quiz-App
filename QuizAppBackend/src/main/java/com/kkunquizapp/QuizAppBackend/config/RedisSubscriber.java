package com.kkunquizapp.QuizAppBackend.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.dto.PlayerResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.UUID;

@Service
public class RedisSubscriber {
    private static final Logger log = LoggerFactory.getLogger(RedisSubscriber.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public RedisSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Redis publishes to channel "game:{gameId}:players".
     * This method is called by MessageListenerAdapter.
     */
    public void handleMessage(String message, String pattern) {
        try {
            // Log raw incoming Redis payload + pattern
            log.info("🔴 RedisSubscriber got message='{}' on pattern='{}'", message, pattern);

            PlayerResponseDTO dto = mapper.readValue(message, PlayerResponseDTO.class);
            UUID gameId = dto.getGameId();  // hoặc pattern.split(":")[1] nếu thích

            String destination = "/topic/game/" + gameId + "/players";
            log.info("🟢 Forwarding to STOMP destination='{}' payload={}", destination, dto);

            messagingTemplate.convertAndSend(destination, Collections.singletonList(dto));

            log.info("✅ Sent to STOMP");
        } catch (JsonProcessingException e) {
            log.error("❌ Failed to parse Redis message", e);
        }
    }
}
