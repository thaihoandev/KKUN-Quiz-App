package com.kkunquizapp.QuizAppBackend.consumer;

import com.kkunquizapp.QuizAppBackend.dto.MessageCreatedEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageCreatedBroadcaster {

    private final SimpMessagingTemplate template;

    /**
     * Lắng nghe sự kiện "message created" do writer phát sau khi lưu DB.
     * Gửi realtime:
     *  - Tới room: /topic/conv.{conversationId}
     *  - Tới từng user: /user/queue/inbox
     *
     * Lưu ý: /user/... cần Principal.getName() == userId (string) ở handshake.
     */
    @KafkaListener(
            topics = "${app.kafka.topics.chatCreated}",
            groupId = "chat-broadcaster" // có thể đưa vào cấu hình
            // containerFactory = "kafkaJsonListenerContainerFactory" // nếu bạn dùng factory custom
    )
    public void onCreated(
            MessageCreatedEventPayload payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(name = KafkaHeaders.RECEIVED_PARTITION, required = false) Integer partition,
            @Header(name = KafkaHeaders.OFFSET, required = false) Long offset
    ) {
        if (payload == null) {
            log.warn("[Broadcast] Null payload from topic {}", topic);
            return;
        }
        try {
            var convId = payload.conversationId();
            var dto    = payload.message();

            log.debug("[Broadcast] topic={} p{}@{} convId={} msgId={} participants={}",
                    topic, partition, offset, convId, dto != null ? dto.getId() : null, payload.participantIds());

            // 1) Gửi tới room
            template.convertAndSend("/topic/conv." + convId, dto);

            // 2) Gửi tới inbox từng user (envelope để FE dễ phân loại)
            Map<String, Object> envelope = Map.of(
                    "type", "NEW_MESSAGE",
                    "message", dto
            );
            for (UUID uid : payload.participantIds()) {
                // Principal.getName() trên WS session phải đúng uid.toString()
                template.convertAndSendToUser(uid.toString(), "/queue/inbox", envelope);
            }
        } catch (Exception ex) {
            log.error("[Broadcast] Error broadcasting created message: {}", ex.getMessage(), ex);
        }
    }
}
