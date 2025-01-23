package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.OptionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.OptionResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.repo.OptionRepo;
import com.kkunquizapp.QuizAppBackend.repo.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements QuestionService {
    @Autowired
    private QuizRepo quizRepository;

    @Autowired
    private QuestionRepo questionRepository;

    @Autowired
    private OptionRepo optionRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public QuestionResponseDTO addQuestion(QuestionRequestDTO questionRequestDTO) {
        // Lấy Quiz từ quizId
        UUID quizId = questionRequestDTO.getQuizId();
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(
                () -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        // Map QuestionRequestDTO sang Question entity
        Question question = modelMapper.map(questionRequestDTO, Question.class);
        question.setQuiz(quiz);

        // Lưu câu hỏi
        Question savedQuestion = questionRepository.save(question);

        // Tạo và lưu danh sách Option
        List<Option> options = questionRequestDTO.getOptions().stream().map(optionDTO -> {
            Option option = createOptionBasedOnQuestionType(optionDTO, questionRequestDTO.getQuestionType());
            option.setQuestion(savedQuestion); // Liên kết với câu hỏi
            return optionRepository.save(option);
        }).toList();

        // Map kết quả trả về DTO
        QuestionResponseDTO responseDTO = modelMapper.map(savedQuestion, QuestionResponseDTO.class);
        responseDTO.setOptions(options.stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }

    /**
     * Tạo Option dựa trên loại câu hỏi (questionType).
     */
    private Option createOptionBasedOnQuestionType(OptionRequestDTO optionDTO, String questionType) {
        switch (questionType) {
            case QuestionType.MULTIPLE_CHOICE_TYPE:
                MultipleChoiceOption mcOption = modelMapper.map(optionDTO, MultipleChoiceOption.class);
                return mcOption;

            case QuestionType.TRUE_FALSE_TYPE:
                TrueFalseOption tfOption = modelMapper.map(optionDTO, TrueFalseOption.class);
                return tfOption;

            case QuestionType.FILL_IN_THE_BLANK_TYPE:
                FillInTheBlankOption fbOption = modelMapper.map(optionDTO, FillInTheBlankOption.class);
                fbOption.setCorrectAnswer(optionDTO.getOptionText());
                return fbOption;

            default:
                throw new IllegalArgumentException("Unsupported question type: " + questionType);
        }
    }


    /**
     * Map từ Option entity sang OptionResponseDTO dựa trên loại Option.
     */
    private OptionResponseDTO mapOptionToResponseDTO(Option option) {
        if (option instanceof MultipleChoiceOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else if (option instanceof TrueFalseOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else if (option instanceof FillInTheBlankOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else {
            throw new IllegalArgumentException("Unsupported option type");
        }
    }
}
