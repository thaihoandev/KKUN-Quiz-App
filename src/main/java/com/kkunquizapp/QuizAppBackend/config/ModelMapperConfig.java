package com.kkunquizapp.QuizAppBackend.config;

import com.kkunquizapp.QuizAppBackend.dto.OptionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.OptionResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.FillInTheBlankOption;
import com.kkunquizapp.QuizAppBackend.model.MultipleChoiceOption;
import com.kkunquizapp.QuizAppBackend.model.Option;
import com.kkunquizapp.QuizAppBackend.model.TrueFalseOption;
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
                .addMapping(OptionRequestDTO::isCorrect, TrueFalseOption::setValue);

        // Ánh xạ từ OptionRequestDTO sang FillInTheBlankOption
        modelMapper.typeMap(OptionRequestDTO.class, FillInTheBlankOption.class)
                .addMapping(OptionRequestDTO::getOptionText, FillInTheBlankOption::setCorrectAnswer);

        return modelMapper;
    }
}
