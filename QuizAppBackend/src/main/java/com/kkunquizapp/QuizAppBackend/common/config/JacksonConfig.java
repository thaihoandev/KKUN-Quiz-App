package com.kkunquizapp.QuizAppBackend.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class JacksonConfig {
    // ==================== 1. ObjectMapper CHÍNH cho toàn bộ API (sạch, không @class) ====================
    @Bean
    @Primary  // ← Đây mới là ObjectMapper chính của Spring Boot (dùng cho @RestController, WebClient, v.v.)
    public ObjectMapper jacksonObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Không bật default typing → API response sạch 100%
        return mapper;
    }
}
