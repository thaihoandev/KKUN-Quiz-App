package com.kkunquizapp.QuizAppBackend.chat.event;

import com.kkunquizapp.QuizAppBackend.chat.event.MessageCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;
import java.util.UUID;

/**
 * Broadcasts the message only AFTER COMMIT so sockets don't receive "ghost" messages.
 */
@Component
@RequiredArgsConstructor
public class MessageBroadcastListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMessageCreated(MessageCreatedEvent e) {
        // Broadcast to conversation topic
        messagingTemplate.convertAndSend("/topic/conv." + e.conversationId(), e.dto());

        // Notify each participant via their personal queue
        for (UUID uid : e.participantIds()) {
            var inboxPayload = Map.of(
                    "type", "NEW_MESSAGE",
                    "conversationId", e.conversationId().toString(),
                    "message", e.dto(),
                    "at", e.dto().getCreatedAt()
            );
            messagingTemplate.convertAndSendToUser(uid.toString(), "/queue/inbox", inboxPayload);
        }
    }
}
