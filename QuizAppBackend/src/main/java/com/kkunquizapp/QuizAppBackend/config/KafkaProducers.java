package com.kkunquizapp.QuizAppBackend.config;

import com.kkunquizapp.QuizAppBackend.dto.ChatMessageCommand;
import com.kkunquizapp.QuizAppBackend.dto.MessageCreatedEventPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaProducers {

    private final KafkaTemplate<String, Object> kafka;

    @Value("${app.kafka.topics.chatSend}")
    private String chatSend;

    @Value("${app.kafka.topics.chatCreated}")
    private String chatCreated;

    public void publishSend(ChatMessageCommand cmd) {
        kafka.send(chatSend, cmd.conversationId().toString(), cmd);
    }

    public void publishCreated(MessageCreatedEventPayload evt) {
        kafka.send(chatCreated, evt.conversationId().toString(), evt);
    }
}
