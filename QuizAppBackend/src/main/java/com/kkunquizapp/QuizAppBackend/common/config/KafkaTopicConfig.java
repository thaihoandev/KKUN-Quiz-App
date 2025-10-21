package com.kkunquizapp.QuizAppBackend.common.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${app.kafka.topics.chatSend}")
    private String chatSend;

    @Value("${app.kafka.topics.chatCreated}")
    private String chatCreated;

    @Bean
    public NewTopic chatSendTopic() {
        return TopicBuilder.name(chatSend).partitions(6).replicas(1).build();
    }

    @Bean
    public NewTopic chatCreatedTopic() {
        return TopicBuilder.name(chatCreated).partitions(6).replicas(1).build();
    }
}
