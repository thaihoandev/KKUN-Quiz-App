package com.kkunquizapp.QuizAppBackend.question.service.impl;

import com.kkunquizapp.QuizAppBackend.fileUpload.service.FileUploadService;
import com.kkunquizapp.QuizAppBackend.question.dto.*;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.question.repository.OptionRepo;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.question.service.QuestionService;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionServiceImpl implements QuestionService {

    private final QuizRepo quizRepository;
    private final QuestionRepo questionRepository;
    private final OptionRepo optionRepository;
    private final ModelMapper modelMapper;
    private final FileUploadService fileUploadService;

    @Override
    @Transactional
    public QuestionResponseDTO addQuestion(QuestionRequestDTO questionRequestDTO) {
        // Validate quiz
        UUID quizId = questionRequestDTO.getQuizId();
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(
                () -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        // Validate question type
        QuestionType questionType = QuestionType.valueOf(questionRequestDTO.getQuestionType());
        validateQuestionRequest(questionRequestDTO, questionType);

        // Map question
        Question question = modelMapper.map(questionRequestDTO, Question.class);
        question.setQuiz(quiz);

        // Xử lý upload ảnh nếu có
        MultipartFile image = questionRequestDTO.getImage();
        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = fileUploadService.uploadImageToCloudinary(image);
                question.setImageUrl(imageUrl);
            } catch (RuntimeException e) {
                throw new IllegalArgumentException("Failed to upload image: " + e.getMessage());
            }
        }

        // Save question
        Question savedQuestion = questionRepository.save(question);

        // Create and save options
        List<Option> options = questionRequestDTO.getOptions().stream()
                .map(optionDTO -> createOptionForQuestionType(optionDTO, questionType, savedQuestion))
                .collect(Collectors.toList());

        // Map response DTO
        QuestionResponseDTO responseDTO = modelMapper.map(savedQuestion, QuestionResponseDTO.class);
        responseDTO.setOptions(options.stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }

    @Override
    @Transactional
    public List<QuestionResponseDTO> addQuestions(List<QuestionRequestDTO> questionRequestDTOs) {
        if (questionRequestDTOs == null || questionRequestDTOs.isEmpty()) {
            throw new IllegalArgumentException("Question list cannot be empty");
        }

        // Lấy quizId từ phần tử đầu (ưu tiên path param ở Controller sẽ set đồng nhất)
        UUID quizId = questionRequestDTOs.get(0).getQuizId();
        if (quizId == null) {
            throw new IllegalArgumentException("QuizId must be provided");
        }

        // Đảm bảo tất cả cùng 1 quizId
        for (QuestionRequestDTO dto : questionRequestDTOs) {
            if (dto.getQuizId() == null) {
                dto.setQuizId(quizId);
            } else if (!quizId.equals(dto.getQuizId())) {
                throw new IllegalArgumentException("All questions in bulk must target the same quiz");
            }
        }

        // Fetch quiz 1 lần
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        List<QuestionResponseDTO> responses = new ArrayList<>();

        // Lặp và xử lý giống addQuestion nhưng tái sử dụng các helper hiện có
        for (QuestionRequestDTO dto : questionRequestDTOs) {
            QuestionType questionType = QuestionType.valueOf(dto.getQuestionType());
            validateQuestionRequest(dto, questionType);

            // Map question
            Question question = modelMapper.map(dto, Question.class);
            question.setQuiz(quiz);

            // Ảnh: ưu tiên upload nếu có file; nếu không thì dùng sẵn imageUrl nếu có
            MultipartFile image = dto.getImage();
            if (image != null && !image.isEmpty()) {
                try {
                    String imageUrl = fileUploadService.uploadImageToCloudinary(image);
                    question.setImageUrl(imageUrl);
                } catch (RuntimeException e) {
                    throw new IllegalArgumentException("Failed to upload image: " + e.getMessage());
                }
            } else if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
                question.setImageUrl(dto.getImageUrl());
            }

            // Lưu question
            Question savedQuestion = questionRepository.save(question);

            // Lưu options
            List<Option> options = dto.getOptions().stream()
                    .map(opt -> createOptionForQuestionType(opt, questionType, savedQuestion))
                    .collect(Collectors.toList());

            // Map response
            QuestionResponseDTO responseDTO = modelMapper.map(savedQuestion, QuestionResponseDTO.class);
            responseDTO.setOptions(options.stream()
                    .map(this::mapOptionToResponseDTO)
                    .collect(Collectors.toList()));

            responses.add(responseDTO);
        }

        return responses;
    }

    @Override
    public QuestionResponseDTO getQuestionById(UUID questionId) {
        // Tìm câu hỏi theo ID
        Question question = questionRepository.findById(questionId).orElseThrow(
                () -> new IllegalArgumentException("Question not found with ID: " + questionId));

        // Map câu hỏi sang DTO
        QuestionResponseDTO responseDTO = modelMapper.map(question, QuestionResponseDTO.class);

        // Map danh sách Option
        responseDTO.setOptions(question.getOptions().stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }

    @Override
    @Transactional
    public QuestionResponseDTO updateQuestion(UUID questionId, QuestionRequestDTO questionRequestDTO) {
        // Find existing question
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + questionId));

        // Validate question type
        QuestionType questionType = QuestionType.valueOf(questionRequestDTO.getQuestionType());
        validateQuestionRequest(questionRequestDTO, questionType);

        // Update question fields
        updateQuestionFields(question, questionRequestDTO);

        // Xử lý upload ảnh nếu có
        MultipartFile image = questionRequestDTO.getImage();
        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = fileUploadService.uploadImageToCloudinary(image);
                question.setImageUrl(imageUrl);
            } catch (RuntimeException e) {
                throw new IllegalArgumentException("Failed to upload image: " + e.getMessage());
            }
        }

        // Update options
        updateQuestionOptions(question, questionRequestDTO, questionType);

        // Save updated question
        Question updatedQuestion = questionRepository.save(question);

        // Map to response DTO
        QuestionResponseDTO responseDTO = modelMapper.map(updatedQuestion, QuestionResponseDTO.class);
        responseDTO.setOptions(updatedQuestion.getOptions().stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }

    @Override
    @Transactional
    public QuestionResponseDTO softDeleteQuestion(UUID questionId) {
        // Tìm câu hỏi theo ID
        Question question = questionRepository.findById(questionId).orElseThrow(
                () -> new IllegalArgumentException("Question not found with ID: " + questionId));

        // Đánh dấu đã xóa
        question.setDeleted(true);

        // Lưu thay đổi
        Question deletedQuestion = questionRepository.save(question);

        // Map sang DTO để trả về
        return modelMapper.map(deletedQuestion, QuestionResponseDTO.class);
    }

    @Override
    public Page<QuestionResponseDTO> getQuestionsByQuizId(UUID quizId, Pageable pageable) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        Page<Question> questionPage = questionRepository.findByQuizAndDeletedFalse(quiz, pageable);

        return questionPage.map(q -> {
            QuestionResponseDTO dto = modelMapper.map(q, QuestionResponseDTO.class);
            dto.setOptions(q.getOptions().stream()
                    .map(this::mapOptionToResponseDTO)
                    .collect(Collectors.toList()));
            return dto;
        });
    }


    @Override
    @Transactional
    public void deleteQuestion(UUID questionId) {
        // Tìm câu hỏi theo ID
        Question question = questionRepository.findById(questionId).orElseThrow(
                () -> new IllegalArgumentException("Question not found with ID: " + questionId));

        // Xóa câu hỏi
        questionRepository.delete(question);
    }

    private Option createOptionForQuestionType(OptionRequestDTO dto, QuestionType type, Question question) {
        Option option;

        switch (type) {
            case MULTIPLE_CHOICE:
                MultipleChoiceOption mc = new MultipleChoiceOption();
                mc.setOptionText(dto.getOptionText());
                mc.setCorrect(dto.isCorrect());
                mc.setQuestion(question);
                option = mc;
                break;

            case SINGLE_CHOICE:
                SingleChoiceOption sc = new SingleChoiceOption();
                sc.setOptionText(dto.getOptionText());
                sc.setCorrect(dto.isCorrect());
                sc.setQuestion(question);
                option = sc;
                break;

            case TRUE_FALSE:
                TrueFalseOption tf = new TrueFalseOption();
                tf.setOptionText(dto.getOptionText());
                tf.setCorrect(dto.isCorrect());
                tf.setQuestion(question);
                option = tf;
                break;

            case FILL_IN_THE_BLANK:
                FillInTheBlankOption fb = new FillInTheBlankOption();
                fb.setOptionText(dto.getOptionText());
                fb.setCorrectAnswer(dto.getOptionText());
                fb.setQuestion(question);
                fb.setCorrect(true);
                option = fb;
                break;

            default:
                throw new IllegalArgumentException("Unsupported question type: " + type);
        }

        return optionRepository.save(option);
    }

    private void updateQuestionFields(Question question, QuestionRequestDTO questionRequestDTO) {
        if (questionRequestDTO.getQuestionText() != null) {
            question.setQuestionText(questionRequestDTO.getQuestionText());
        }
        if (questionRequestDTO.getQuestionType() != null) {
            question.setQuestionType(QuestionType.valueOf(questionRequestDTO.getQuestionType()));
        }
        if (questionRequestDTO.getTimeLimit() > 0) {
            question.setTimeLimit(questionRequestDTO.getTimeLimit());
        }
        if (questionRequestDTO.getPoints() > 0) {
            question.setPoints(questionRequestDTO.getPoints());
        }
        if (questionRequestDTO.getQuizId() != null) {
            Quiz quiz = quizRepository.findById(questionRequestDTO.getQuizId())
                    .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + questionRequestDTO.getQuizId()));
            question.setQuiz(quiz);
        }
    }

    private void updateQuestionOptions(Question question, QuestionRequestDTO questionRequestDTO, QuestionType questionType) {
        // Remove existing options
        optionRepository.deleteAll(question.getOptions());
        question.getOptions().clear();

        // Create new options
        List<Option> newOptions = questionRequestDTO.getOptions().stream()
                .map(optionDTO -> createOptionForQuestionType(optionDTO, questionType, question))
                .collect(Collectors.toList());

        question.getOptions().addAll(newOptions);
    }

    private void validateQuestionRequest(QuestionRequestDTO questionRequestDTO, QuestionType questionType) {
        // Validate options based on question type
        if (questionRequestDTO.getOptions() == null || questionRequestDTO.getOptions().isEmpty()) {
            throw new IllegalArgumentException("Options cannot be empty");
        }

        // Validate image file (optional)
        MultipartFile image = questionRequestDTO.getImage();
        if (image != null && !image.isEmpty()) {
            String contentType = image.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                throw new IllegalArgumentException("Only JPEG or PNG images are allowed");
            }
            if (image.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Image size exceeds 5MB");
            }
        }

        switch (questionType) {
            case MULTIPLE_CHOICE:
                long correctOptionsCount = questionRequestDTO.getOptions().stream()
                        .filter(OptionRequestDTO::isCorrect)
                        .count();
                if (correctOptionsCount == 0) {
                    throw new IllegalArgumentException("Multiple choice question must have at least one correct option");
                }
                break;

            case SINGLE_CHOICE:
                correctOptionsCount = questionRequestDTO.getOptions().stream()
                        .filter(OptionRequestDTO::isCorrect)
                        .count();
                if (correctOptionsCount != 1) {
                    throw new IllegalArgumentException("Single choice question must have exactly one correct option");
                }
                if (questionRequestDTO.getOptions().size() < 2) {
                    throw new IllegalArgumentException("Single choice question must have at least 2 options");
                }
                break;

            case TRUE_FALSE:
                if (questionRequestDTO.getOptions().size() != 2) {
                    throw new IllegalArgumentException("True/False question must have exactly 2 options");
                }
                break;

            case FILL_IN_THE_BLANK:
                if (questionRequestDTO.getOptions().size() != 1) {
                    throw new IllegalArgumentException("Fill in the blank question must have exactly one option");
                }
                String correctAnswer = questionRequestDTO.getOptions().get(0).getOptionText();
                if (correctAnswer == null || correctAnswer.isBlank()) {
                    throw new IllegalArgumentException("Correct answer must not be blank for fill-in-the-blank");
                }
                break;
        }
    }

    private OptionResponseDTO mapOptionToResponseDTO(Option option) {
        if (option instanceof MultipleChoiceOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else if (option instanceof TrueFalseOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else if (option instanceof FillInTheBlankOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else if (option instanceof SingleChoiceOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else {
            throw new IllegalArgumentException("Unsupported option type");
        }
    }

    private QuestionResponseDTO convertToQuestionDTO(Question question) {
        QuestionResponseDTO responseDTO = modelMapper.map(question, QuestionResponseDTO.class);

        // Chuyển đổi danh sách options
        responseDTO.setOptions(question.getOptions().stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }
}