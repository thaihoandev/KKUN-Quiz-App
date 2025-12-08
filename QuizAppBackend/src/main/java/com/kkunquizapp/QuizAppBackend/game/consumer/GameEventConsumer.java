package com.kkunquizapp.QuizAppBackend.game.comsumer;

import com.kkunquizapp.QuizAppBackend.game.event.GameEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameEventConsumer {

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "game-events", groupId = "game-websocket-group")
    public void consumeGameEvent(GameEvent event) {
        try {
            // Broadcast đến tất cả clients trong game
            messagingTemplate.convertAndSend(
                    "/topic/game/" + event.getGameId(),
                    event
            );

            // Gửi riêng cho user nếu cần
            if (event.getUserId() != null) {
                messagingTemplate.convertAndSendToUser(
                        event.getUserId().toString(),
                        "/queue/game-updates",
                        event
                );
            }

            log.debug("Broadcasted event {} to game {}", event.getEventType(), event.getGameId());

        } catch (Exception e) {
            log.error("Failed to broadcast event: {}", e.getMessage(), e);
        }
    }
}