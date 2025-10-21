package com.kkunquizapp.QuizAppBackend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaErrorHandlingConfig {
    @Bean
    public DefaultErrorHandler errorHandler() {
        // retry 3 lần, mỗi lần cách 1s; sau đó tuỳ DLT config của cluster
        return new DefaultErrorHandler(new FixedBackOff(1000L, 3L));
    }
}
