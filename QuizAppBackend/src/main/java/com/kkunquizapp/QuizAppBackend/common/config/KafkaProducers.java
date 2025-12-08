package com.kkunquizapp.QuizAppBackend.common.config;

import com.kkunquizapp.QuizAppBackend.common.dto.ChatMessageCommand;
import com.kkunquizapp.QuizAppBackend.common.dto.MessageCreatedEventPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaProducers {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.chat-send}")
    private String chatSendTopic;

    @Value("${app.kafka.topics.chat-created}")
    private String chatCreatedTopic;

    public void publishSend(ChatMessageCommand cmd) {
        kafkaTemplate.send(chatSendTopic, cmd.conversationId().toString(), cmd);
    }

    public void publishCreated(MessageCreatedEventPayload evt) {
        kafkaTemplate.send(chatCreatedTopic, evt.conversationId().toString(), evt);
    }
}