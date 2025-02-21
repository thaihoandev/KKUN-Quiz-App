package com.kkunquizapp.QuizAppBackend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.dto.*;
import com.kkunquizapp.QuizAppBackend.exception.GameStateException;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.repo.OptionRepo;
import com.kkunquizapp.QuizAppBackend.repo.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import com.kkunquizapp.QuizAppBackend.service.GameService;
import com.kkunquizapp.QuizAppBackend.service.LeaderboardService;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionServiceImpl implements QuestionService {

    private final QuizRepo quizRepository;
    private final QuestionRepo questionRepository;
    private final OptionRepo optionRepository;
    private final ModelMapper modelMapper;
    private final TaskScheduler taskScheduler;
    private final LeaderboardService leaderboardService;

    private GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String GAME_QUESTION_KEY = "game_questions:";

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
        // Tìm câu hỏi trong cơ sở dữ liệu
        Question question = questionRepository.findById(questionId).orElseThrow(
                () -> new IllegalArgumentException("Question not found with ID: " + questionId));

        // Cập nhật các trường của câu hỏi nếu có trong request
        if (questionRequestDTO.getQuestionText() != null) {
            question.setQuestionText(questionRequestDTO.getQuestionText());
        }

        if (questionRequestDTO.getQuestionType() != null) {
            question.setQuestionType(QuestionType.valueOf(questionRequestDTO.getQuestionType()));
        }

        if (questionRequestDTO.getImageUrl() != null) {
            question.setImageUrl(questionRequestDTO.getImageUrl());
        }

        if (questionRequestDTO.getTimeLimit() > 0) {
            question.setTimeLimit(questionRequestDTO.getTimeLimit());
        }

        if (questionRequestDTO.getPoints() > 0) {
            question.setPoints(questionRequestDTO.getPoints());
        }

        if (questionRequestDTO.getQuizId() != null) {
            Quiz quiz = quizRepository.findById(questionRequestDTO.getQuizId()).orElseThrow(
                    () -> new IllegalArgumentException("Quiz not found with ID: " + questionRequestDTO.getQuizId()));
            question.setQuiz(quiz);
        }

        // Xử lý cập nhật các Option
        if (questionRequestDTO.getOptions() != null) {
            // Tìm tất cả các Option hiện tại trong cơ sở dữ liệu
            List<Option> existingOptions = question.getOptions();

            // Lưu danh sách các Option ID được xử lý
            List<UUID> processedOptionIds = new ArrayList<>();

            // Cập nhật và thêm mới các Option
            List<Option> updatedOptions = questionRequestDTO.getOptions().stream().map(optionDTO -> {
                if (optionDTO.getOptionId() != null) {
                    // Cập nhật Option đã tồn tại
                    Option existingOption = optionRepository.findById(optionDTO.getOptionId()).orElseThrow(
                            () -> new IllegalArgumentException("Option not found with ID: " + optionDTO.getOptionId()));
                    updateOptionBasedOnType(existingOption, optionDTO);
                    processedOptionIds.add(existingOption.getOptionId());
                    return existingOption;
                } else {
                    // Thêm mới Option
                    Option newOption = createOptionBasedOnQuestionType(optionDTO, questionRequestDTO.getQuestionType());
                    newOption.setQuestion(question); // Liên kết với Question
                    return newOption;
                }
            }).toList();

            // Xóa các Option không còn tồn tại trong request
            existingOptions.removeIf(option -> !processedOptionIds.contains(option.getOptionId()));

            // Đồng bộ danh sách Option
            question.getOptions().clear();
            question.getOptions().addAll(updatedOptions);
        }


        // Lưu câu hỏi đã cập nhật
        Question updatedQuestion = questionRepository.save(question);

        // Map câu hỏi sang DTO để trả về
        QuestionResponseDTO responseDTO = modelMapper.map(updatedQuestion, QuestionResponseDTO.class);
        responseDTO.setOptions(updatedQuestion.getOptions().stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }


    @Override
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
    public List<QuestionResponseDTO> getQuestionsByQuizId(UUID quizId) {
        // Lấy Quiz từ DB
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(
                () -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        // Lấy danh sách câu hỏi của Quiz
        List<Question> questions = questionRepository.findAllByQuiz(quiz);

        // Map danh sách câu hỏi sang DTO
        return questions.stream().map(question -> {
            QuestionResponseDTO responseDTO = modelMapper.map(question, QuestionResponseDTO.class);
            responseDTO.setOptions(question.getOptions().stream()
                    .map(this::mapOptionToResponseDTO)
                    .collect(Collectors.toList()));
            return responseDTO;
        }).collect(Collectors.toList());
    }

    @Override
    public void deleteQuestion(UUID questionId) {
        // Tìm câu hỏi theo ID
        Question question = questionRepository.findById(questionId).orElseThrow(
                () -> new IllegalArgumentException("Question not found with ID: " + questionId));

        // Xóa câu hỏi
        questionRepository.delete(question);
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

    private void updateOptionBasedOnType(Option existingOption, OptionRequestDTO optionDTO) {
        if (existingOption instanceof MultipleChoiceOption) {
            MultipleChoiceOption mcOption = (MultipleChoiceOption) existingOption;
            mcOption.setOptionText(optionDTO.getOptionText());
            mcOption.setCorrect(optionDTO.isCorrect());
        } else if (existingOption instanceof TrueFalseOption) {
            TrueFalseOption tfOption = (TrueFalseOption) existingOption;
            tfOption.setOptionText(optionDTO.getOptionText());
            tfOption.setValue(optionDTO.isCorrect());
        } else if (existingOption instanceof FillInTheBlankOption) {
            FillInTheBlankOption fbOption = (FillInTheBlankOption) existingOption;
            fbOption.setOptionText(optionDTO.getOptionText());
            fbOption.setCorrectAnswer(optionDTO.getOptionText()); // Dùng correct answer
        } else {
            throw new IllegalArgumentException("Unsupported option type");
        }
    }

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
    private QuestionResponseDTO convertToQuestionDTO(Question question) {
        QuestionResponseDTO responseDTO = modelMapper.map(question, QuestionResponseDTO.class);

        // Chuyển đổi danh sách options
        responseDTO.setOptions(question.getOptions().stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }



    public void sendQuestionToPlayers(Game game, List<QuestionResponseDTO> allQuestions) {
        String currentQuestionIndexKey = GAME_QUESTION_KEY + game.getGameId() + ":index";

        try {
            Integer currentQuestionIndex = (Integer) redisTemplate.opsForValue().get(currentQuestionIndexKey);
            if (currentQuestionIndex == null) {
                currentQuestionIndex = 0;
                redisTemplate.opsForValue().set(currentQuestionIndexKey, currentQuestionIndex);
            }

            // Kiểm tra nếu đã hết câu hỏi
            if (currentQuestionIndex >= allQuestions.size()) {
                redisTemplate.delete(currentQuestionIndexKey);
                log.info("Game {} đã hoàn thành, gửi cập nhật cuối cùng.", game.getGameId());

                // Gửi cập nhật trạng thái cuối cùng trước khi kết thúc game
                taskScheduler.schedule(
                        () -> gameService.sendGameUpdates(game, allQuestions, true),
                        Instant.now().plusSeconds(5) // Delay để client có thời gian nhận thông tin
                );
                return;
            }

            QuestionResponseDTO currentQuestion = allQuestions.get(currentQuestionIndex);
            messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/question", currentQuestion);

            // Cập nhật index cho câu hỏi tiếp theo
            redisTemplate.opsForValue().increment(currentQuestionIndexKey);

            long timeLimit = currentQuestion.getTimeLimit() > 0 ? currentQuestion.getTimeLimit() : 5;
            long leaderboardTime = 5;

            // Schedule cập nhật bảng xếp hạng
            taskScheduler.schedule(
                    () -> leaderboardService.sendLeaderboard(game),
                    Instant.now().plusSeconds(timeLimit)
            );

            // Schedule câu hỏi tiếp theo (nếu còn)
            taskScheduler.schedule(
                    () -> sendQuestionToPlayers(game, allQuestions),
                    Instant.now().plusSeconds(timeLimit + leaderboardTime)
            );

        } catch (Exception e) {
            log.error("Lỗi trong sendQuestionToPlayers cho game {}: {}", game.getGameId(), e.getMessage());
        }
    }

}
