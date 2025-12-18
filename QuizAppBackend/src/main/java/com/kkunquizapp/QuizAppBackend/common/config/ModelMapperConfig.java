package com.kkunquizapp.QuizAppBackend.common.config;

import com.kkunquizapp.QuizAppBackend.question.model.*;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        // Sử dụng chiến lược ánh xạ STRICT
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setAmbiguityIgnored(true);

        return modelMapper;
    }
}
