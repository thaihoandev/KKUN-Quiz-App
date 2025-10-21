package com.kkunquizapp.QuizAppBackend.common.config;

import com.kkunquizapp.QuizAppBackend.question.dto.OptionRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionRequestDTO;
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

        // Ánh xạ từ OptionRequestDTO sang MultipleChoiceOption
        modelMapper.typeMap(OptionRequestDTO.class, MultipleChoiceOption.class)
                .addMapping(OptionRequestDTO::isCorrect, MultipleChoiceOption::setCorrect);

        // Ánh xạ từ OptionRequestDTO sang TrueFalseOption
        modelMapper.typeMap(OptionRequestDTO.class, TrueFalseOption.class)
                .addMapping(OptionRequestDTO::isCorrect, TrueFalseOption::setCorrect);

        // Ánh xạ từ OptionRequestDTO sang FillInTheBlankOption
        modelMapper.typeMap(OptionRequestDTO.class, FillInTheBlankOption.class)
                .addMapping(OptionRequestDTO::getOptionText, FillInTheBlankOption::setCorrectAnswer);

        modelMapper.typeMap(QuestionRequestDTO.class, Question.class).addMappings(mapper -> {
            mapper.skip(Question::setOptions); // Bỏ qua ánh xạ mặc định cho options
        });
        return modelMapper;
    }
}
