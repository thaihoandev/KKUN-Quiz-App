package com.kkunquizapp.QuizAppBackend.question.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.FileUploadService;
import com.kkunquizapp.QuizAppBackend.question.dto.*;
import com.kkunquizapp.QuizAppBackend.question.exception.QuestionNotFoundException;
import com.kkunquizapp.QuizAppBackend.question.exception.ValidationException;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.question.repository.OptionRepo;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.question.service.QuestionService;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
@Slf4j
public class QuestionServiceImpl implements QuestionService {

    private final QuizRepo quizRepository;
    private final QuestionRepo questionRepository;
    private final OptionRepo optionRepository;
    private final ModelMapper modelMapper;
    private final FileUploadService fileUploadService;
    private final ObjectMapper objectMapper;

    // ==================== CREATE QUESTION ====================

    @Override
    public QuestionResponseDTO addQuestion(QuestionRequestDTO request, UUID userId) {
        log.info("Adding question to quiz: {}", request.getQuizId());

        // Validate quiz exists
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new QuestionNotFoundException("Quiz not found"));

        // Validate question
        validateQuestionRequest(request);

        // Parse question type
        QuestionType questionType = QuestionType.valueOf(request.getQuestionType());

        // Create question
        Question question = Question.builder()
                .quiz(quiz)
                .questionText(request.getQuestionText().trim())
                .type(questionType)
                .timeLimitSeconds(request.getTimeLimitSeconds() > 0 ? request.getTimeLimitSeconds() : 20)
                .points(request.getPoints() > 0 ? request.getPoints() : 100)
                .orderIndex(request.getOrderIndex())
                .explanation(request.getExplanation())
                .hint(request.getHint())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM")
                .tagsJson(toJsonArray(request.getTags()))
                .shuffleOptions(request.isShuffleOptions())
                .caseInsensitive(request.isCaseInsensitive())
                .partialCredit(request.isPartialCredit())
                .allowMultipleCorrect(request.isAllowMultipleCorrect())
                .answerVariationsJson(toJsonArray(request.getAnswerVariations()))
                .createdBy(userId)
                .updatedBy(userId)
                .deleted(false)
                .version(1)
                .build();

        // Handle image upload
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            question.setImageUrl(uploadImage(request.getImage()));
        } else if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            question.setImageUrl(request.getImageUrl());
        }

        // Mark rich content flags
        markRichContentFlags(question, request);

        question = questionRepository.save(question);
        log.info("Question created: {}", question.getQuestionId());

        // Create options
        createOptions(question, request.getOptions(), questionType);

        return mapToResponseDTO(question);
    }

    @Override
    public List<QuestionResponseDTO> addQuestions(List<QuestionRequestDTO> requests, UUID userId) {
        log.info("Adding {} questions in bulk", requests.size());

        if (requests.isEmpty()) {
            throw new ValidationException("Question list cannot be empty");
        }

        // All must have same quizId
        UUID quizId = requests.get(0).getQuizId();
        if (quizId == null) {
            throw new ValidationException("QuizId is required");
        }

        // Validate quiz exists
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new QuestionNotFoundException("Quiz not found"));

        List<QuestionResponseDTO> responses = new ArrayList<>();

        for (QuestionRequestDTO request : requests) {
            try {
                request.setQuizId(quizId);
                responses.add(addQuestion(request, userId));
            } catch (Exception e) {
                log.error("Error adding question: {}", e.getMessage());
                throw new ValidationException("Error in bulk add: " + e.getMessage());
            }
        }

        log.info("Successfully added {} questions", responses.size());
        return responses;
    }

    // ==================== READ QUESTION ====================

    @Override
    public QuestionResponseDTO getQuestionById(UUID questionId) {
        log.info("Fetching question: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        return mapToResponseDTO(question);
    }

    @Override
    public Page<QuestionResponseDTO> getQuestionsByQuiz(UUID quizId, Pageable pageable) {
        log.info("Fetching questions for quiz: {}", quizId);

        // Validate quiz exists
        if (!quizRepository.existsById(quizId)) {
            throw new QuestionNotFoundException("Quiz not found");
        }

        return questionRepository.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(quizId, pageable)
                .map(this::mapToResponseDTO);
    }

    @Override
    public Page<QuestionResponseDTO> searchQuestions(String keyword, String questionType, String difficulty, Pageable pageable) {
        log.info("Searching questions: keyword={}, type={}, difficulty={}", keyword, questionType, difficulty);

        return questionRepository.searchQuestions(keyword, questionType, difficulty, pageable)
                .map(this::mapToResponseDTO);
    }

    @Override
    public List<QuestionResponseDTO> getQuestionsByTag(String tag) {
        log.info("Getting questions by tag: {}", tag);

        return questionRepository.findByTagsJsonContainsAndDeletedFalse(tag)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuestionResponseDTO> getFavoriteQuestions(UUID userId) {
        log.info("Getting favorite questions for user: {}", userId);

        return questionRepository.findFavoritesByUserId(userId)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    // ==================== UPDATE QUESTION ====================

    @Override
    public QuestionResponseDTO updateQuestion(UUID questionId, QuestionUpdateRequest request, UUID userId) {
        log.info("Updating question: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        // Validate new data
        validateUpdateRequest(request);

        // Update fields
        if (request.getQuestionText() != null) {
            question.setQuestionText(request.getQuestionText().trim());
        }
        if (request.getExplanation() != null) {
            question.setExplanation(request.getExplanation());
        }
        if (request.getHint() != null) {
            question.setHint(request.getHint());
        }
        if (request.getDifficulty() != null) {
            question.setDifficulty(request.getDifficulty());
        }
        if (request.getTags() != null) {
            question.setTagsJson(toJsonArray(request.getTags()));
        }
        if (request.getPoints() > 0) {
            question.setPoints(request.getPoints());
        }
        if (request.getTimeLimitSeconds() > 0) {
            question.setTimeLimitSeconds(request.getTimeLimitSeconds());
        }
        question.setShuffleOptions(request.isShuffleOptions());
        question.setCaseInsensitive(request.isCaseInsensitive());
        question.setPartialCredit(request.isPartialCredit());

        // Increment version
        question.setVersion(question.getVersion() + 1);
        question.setUpdatedBy(userId);

        // Update options if provided
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            updateOptions(question, request.getOptions());
        }

        // Mark rich content flags
        markRichContentFlags(question, null);

        question = questionRepository.save(question);
        log.info("Question updated: {}", questionId);

        return mapToResponseDTO(question);
    }

    // ==================== DELETE QUESTION ====================

    @Override
    public void softDeleteQuestion(UUID questionId, UUID userId) {
        log.info("Soft deleting question: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        question.setDeleted(true);
        question.setDeletedAt(LocalDateTime.now());
        question.setDeletedBy(userId);
        questionRepository.save(question);

        log.info("Question soft deleted: {}", questionId);
    }

    @Override
    public void hardDeleteQuestion(UUID questionId) {
        log.info("Hard deleting question: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        // Delete all options (cascade)
        optionRepository.deleteAll(question.getOptions());

        // Delete question
        questionRepository.delete(question);

        log.info("Question hard deleted: {}", questionId);
    }

    @Override
    public void restoreQuestion(UUID questionId, UUID userId) {
        log.info("Restoring question: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        if (!question.isDeleted()) {
            throw new ValidationException("Question is not deleted");
        }

        question.setDeleted(false);
        question.setDeletedAt(null);
        question.setDeletedBy(null);
        question.setUpdatedBy(userId);
        questionRepository.save(question);

        log.info("Question restored: {}", questionId);
    }

    // ==================== DUPLICATE QUESTION ====================

    @Override
    public QuestionResponseDTO duplicateQuestion(UUID sourceQuestionId, UUID targetQuizId, UUID userId) {
        log.info("Duplicating question: {} to quiz: {}", sourceQuestionId, targetQuizId);

        Question original = questionRepository.findById(sourceQuestionId)
                .orElseThrow(() -> new QuestionNotFoundException("Source question not found"));

        Quiz targetQuiz = quizRepository.findById(targetQuizId)
                .orElseThrow(() -> new QuestionNotFoundException("Target quiz not found"));

        // Create copy
        Question copy = Question.builder()
                .quiz(targetQuiz)
                .questionText(original.getQuestionText())
                .type(original.getType())
                .imageUrl(original.getImageUrl())
                .timeLimitSeconds(original.getTimeLimitSeconds())
                .points(original.getPoints())
                .orderIndex(original.getOrderIndex())
                .explanation(original.getExplanation())
                .hint(original.getHint())
                .difficulty(original.getDifficulty())
                .tagsJson(original.getTagsJson())
                .shuffleOptions(original.isShuffleOptions())
                .caseInsensitive(original.isCaseInsensitive())
                .partialCredit(original.isPartialCredit())
                .allowMultipleCorrect(original.isAllowMultipleCorrect())
                .answerVariationsJson(original.getAnswerVariationsJson())
                .hasLatex(original.isHasLatex())
                .hasCode(original.isHasCode())
                .hasTable(original.isHasTable())
                .hasVideo(original.isHasVideo())
                .hasAudio(original.isHasAudio())
                .createdBy(userId)
                .updatedBy(userId)
                .deleted(false)
                .version(1)
                .build();

        copy = questionRepository.save(copy);

        // Copy options
        for (Option originalOption : original.getOptions()) {
            createOptionCopy(originalOption, copy);
        }

        log.info("Question duplicated: {} to {}", sourceQuestionId, copy.getQuestionId());
        return mapToResponseDTO(copy);
    }

    @Override
    public List<QuestionResponseDTO> duplicateQuestionsFromQuiz(UUID sourceQuizId, UUID targetQuizId, UUID userId) {
        log.info("Duplicating all questions from quiz: {} to quiz: {}", sourceQuizId, targetQuizId);

        List<Question> sourceQuestions = questionRepository.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(sourceQuizId);
        List<QuestionResponseDTO> responses = new ArrayList<>();

        for (Question question : sourceQuestions) {
            try {
                responses.add(duplicateQuestion(question.getQuestionId(), targetQuizId, userId));
            } catch (Exception e) {
                log.error("Error duplicating question: {}", e.getMessage());
            }
        }

        log.info("Successfully duplicated {} questions", responses.size());
        return responses;
    }

    // ==================== BULK IMPORT/EXPORT ====================

    @Override
    public BulkQuestionImportResponse importQuestionsFromCSV(MultipartFile file, UUID quizId, UUID userId) {
        log.info("Importing questions from CSV for quiz: {}", quizId);

        BulkQuestionImportResponse response = new BulkQuestionImportResponse();
        List<QuestionImportResult> results = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try {
            Quiz quiz = quizRepository.findById(quizId)
                    .orElseThrow(() -> new QuestionNotFoundException("Quiz not found"));

            Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
            CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader());

            int rowNumber = 1;
            for (CSVRecord record : csvParser) {
                try {
                    rowNumber++;

                    // Parse CSV: question_text, question_type, option1, option2, option3, correct_answer
                    String questionText = record.get(0);
                    String questionType = record.get(1);

                    if (questionText == null || questionText.isBlank()) {
                        results.add(QuestionImportResult.builder()
                                .rowNumber(rowNumber)
                                .status("FAILED")
                                .errorMessage("Question text is empty")
                                .build());
                        continue;
                    }

                    // Create question based on type
                    QuestionResponseDTO questionDTO = createQuestionFromCSV(
                            questionText, questionType, record, quiz, userId
                    );

                    results.add(QuestionImportResult.builder()
                            .rowNumber(rowNumber)
                            .status("SUCCESS")
                            .questionId(questionDTO.getQuestionId())
                            .build());

                } catch (Exception e) {
                    log.error("Error importing row {}: {}", rowNumber, e.getMessage());
                    results.add(QuestionImportResult.builder()
                            .rowNumber(rowNumber)
                            .status("FAILED")
                            .errorMessage(e.getMessage())
                            .build());
                }
            }

            csvParser.close();

            response.setTotalQuestions(results.size());
            response.setSuccessCount((int) results.stream().filter(r -> r.getStatus().equals("SUCCESS")).count());
            response.setFailedCount(response.getTotalQuestions() - response.getSuccessCount());
            response.setResults(results);

        } catch (Exception e) {
            log.error("Error reading CSV file: {}", e.getMessage());
            errors.add("File parsing error: " + e.getMessage());
        }

        response.setErrors(errors);
        log.info("CSV import completed: {} success, {} failed", response.getSuccessCount(), response.getFailedCount());
        return response;
    }

    @Override
    public byte[] exportQuestionsAsCSV(UUID quizId) {
        log.info("Exporting questions as CSV for quiz: {}", quizId);

        List<Question> questions = questionRepository.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(quizId);

        StringBuilder csv = new StringBuilder();
        csv.append("Question Text,Type,Option 1,Option 2,Option 3,Option 4,Correct Answer,Difficulty,Points,Time Limit\n");

        for (Question question : questions) {
            csv.append("\"").append(escapeCsv(question.getQuestionText())).append("\",");
            csv.append(question.getType()).append(",");

            // Add options
            List<Option> options = question.getOptions();
            for (int i = 0; i < 4; i++) {
                if (i < options.size()) {
                    csv.append("\"").append(escapeCsv(options.get(i).getText())).append("\"");
                }
                csv.append(",");
            }

            // Correct answer(s)
            String correctAnswers = options.stream()
                    .filter(Option::isCorrect)
                    .map(Option::getText)
                    .collect(Collectors.joining("|"));
            csv.append("\"").append(escapeCsv(correctAnswers)).append("\",");

            csv.append(question.getDifficulty()).append(",");
            csv.append(question.getPoints()).append(",");
            csv.append(question.getTimeLimitSeconds()).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ==================== QUESTION ANALYTICS ====================

    @Override
    public QuestionAnalyticsDTO getQuestionAnalytics(UUID questionId) {
        log.info("Getting analytics for question: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        QuestionAnalyticsDTO analytics = QuestionAnalyticsDTO.builder()
                .questionId(question.getQuestionId())
                .questionText(question.getQuestionText())
                .questionType(question.getType().toString())
                .totalAttempts(question.getTotalAttempts())
                .correctAttempts(question.getCorrectAttempts())
                .passRate(question.getPassRate())
                .averageTimeSeconds(question.getAverageTimeSeconds())
                .difficultyIndex(question.getDifficultyIndex())
                .discriminationIndex(question.getDiscriminationIndex())
                .build();

        // Add option-level analytics
        List<OptionAnalyticsDTO> optionAnalytics = question.getOptions().stream()
                .map(option -> OptionAnalyticsDTO.builder()
                        .optionId(option.getOptionId())
                        .optionText(option.getText())
                        .isCorrect(option.isCorrect())
                        .build())
                .collect(Collectors.toList());

        analytics.setOptionAnalytics(optionAnalytics);
        return analytics;
    }

    // ==================== FAVORITE QUESTIONS ====================

    @Override
    public void markAsFavorite(UUID questionId, UUID userId) {
        log.info("Marking question as favorite: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        question.setFavorite(true);
        questionRepository.save(question);
    }

    @Override
    public void unmarkAsFavorite(UUID questionId, UUID userId) {
        log.info("Unmarking question as favorite: {}", questionId);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException("Question not found"));

        question.setFavorite(false);
        questionRepository.save(question);
    }

    // ==================== HELPER METHODS ====================

    private void createOptions(Question question, List<OptionRequestDTO> optionDTOs, QuestionType type) {
        if (optionDTOs == null || optionDTOs.isEmpty()) {
            throw new ValidationException("Options cannot be empty");
        }

        for (OptionRequestDTO dto : optionDTOs) {
            createOption(question, dto, type);
        }
    }

    private Option createOption(Question question, OptionRequestDTO dto, QuestionType type) {
        Option option;

        switch (type) {
            case MULTIPLE_CHOICE -> {
                MultipleChoiceOption mco = new MultipleChoiceOption();
                mco.setText(dto.getText());
                mco.setCorrect(dto.isCorrect());
                mco.setOrderIndex(dto.getOrderIndex());
                mco.setExplanation(dto.getExplanation());
                mco.setQuestion(question);
                option = mco;
            }
            case SINGLE_CHOICE -> {
                SingleChoiceOption sco = new SingleChoiceOption();
                sco.setText(dto.getText());
                sco.setCorrect(dto.isCorrect());
                sco.setOrderIndex(dto.getOrderIndex());
                sco.setExplanation(dto.getExplanation());
                sco.setQuestion(question);
                option = sco;
            }
            case TRUE_FALSE -> {
                TrueFalseOption tfo = new TrueFalseOption();
                tfo.setText(dto.getText());
                tfo.setCorrect(dto.isCorrect());
                tfo.setQuestion(question);
                option = tfo;
            }
            case FILL_IN_THE_BLANK -> {
                FillInTheBlankOption fbo = new FillInTheBlankOption();
                fbo.setCorrectAnswer(dto.getCorrectAnswer());
                fbo.setCaseInsensitive(dto.isCaseInsensitive());
                fbo.setAcceptedVariations(dto.getAcceptedVariations());
                fbo.setTypoTolerance(dto.getTypoTolerance());
                fbo.setQuestion(question);
                fbo.setCorrect(true);
                option = fbo;
            }
            case MATCHING -> {
                MatchingOption mo = new MatchingOption();
                mo.setLeftItem(dto.getLeftItem());
                mo.setRightItem(dto.getRightItem());
                mo.setCorrectMatchKey(dto.getCorrectMatchKey());
                mo.setQuestion(question);
                mo.setCorrect(true);
                option = mo;
            }
            case ORDERING -> {
                OrderingOption oo = new OrderingOption();
                oo.setItem(dto.getItem());
                oo.setCorrectPosition(dto.getCorrectPosition());
                oo.setOrderIndex(dto.getCorrectPosition());
                oo.setQuestion(question);
                oo.setCorrect(true);
                option = oo;
            }
            case DRAG_DROP -> {
                DragDropOption ddo = new DragDropOption();
                ddo.setDraggableItem(dto.getDraggableItem());
                ddo.setDropZoneId(dto.getDropZoneId());
                ddo.setDropZoneLabel(dto.getDropZoneLabel());
                ddo.setDragImageUrl(dto.getDragImageUrl());
                ddo.setQuestion(question);
                ddo.setCorrect(true);
                option = ddo;
            }
            case SHORT_ANSWER -> {
                ShortAnswerOption sao = new ShortAnswerOption();
                sao.setExpectedAnswer(dto.getExpectedAnswer());
                sao.setRequiredKeywords(toJsonArray(dto.getRequiredKeywords()));
                sao.setOptionalKeywords(toJsonArray(dto.getOptionalKeywords()));
                sao.setCaseInsensitive(dto.isCaseInsensitive());
                sao.setPartialCreditPercentage(dto.getPartialCreditPercentage());
                sao.setQuestion(question);
                sao.setCorrect(true);
                option = sao;
            }
            case ESSAY -> {
                EssayOption eo = new EssayOption();
                eo.setMinWords(dto.getMinWords());
                eo.setMaxWords(dto.getMaxWords());
                eo.setSampleAnswer(dto.getSampleAnswer());
                eo.setEnablePlagiarismCheck(dto.isEnablePlagiarismCheck());
                eo.setQuestion(question);
                option = eo;
            }
            case HOTSPOT -> {
                HotspotOption ho = new HotspotOption();
                ho.setImageUrl(question.getImageUrl());
                ho.setHotspotLabel(dto.getHotspotLabel());
                ho.setQuestion(question);
                ho.setCorrect(true);
                option = ho;
            }
            case IMAGE_SELECTION -> {
                ImageSelectionOption iso = new ImageSelectionOption();
                iso.setImageUrl(dto.getImageUrl());
                iso.setImageLabel(dto.getImageLabel());
                iso.setThumbnailUrl(dto.getThumbnailUrl());
                iso.setCorrect(dto.isCorrect());
                iso.setQuestion(question);
                option = iso;
            }
            case DROPDOWN -> {
                DropdownOption dro = new DropdownOption();
                dro.setDropdownValue(dto.getDropdownValue());
                dro.setDisplayLabel(dto.getDisplayLabel());
                dro.setPlaceholder(dto.getPlaceholder());
                dro.setCorrect(dto.isCorrect());
                dro.setQuestion(question);
                option = dro;
            }
            case MATRIX -> {
                MatrixOption mao = new MatrixOption();
                mao.setRowId(dto.getRowId());
                mao.setColumnId(dto.getColumnId());
                mao.setRowLabel(dto.getRowLabel());
                mao.setColumnLabel(dto.getColumnLabel());
                mao.setCellValue(dto.getCellValue());
                mao.setCorrectCell(dto.isCorrectCell());
                mao.setQuestion(question);
                option = mao;
            }
            case RANKING -> {
                RankingOption ro = new RankingOption();
                ro.setRankableItem(dto.getRankableItem());
                ro.setCorrectRank(dto.getCorrectRank());
                ro.setRankingScale(dto.getRankingScale());
                ro.setAllowPartialCredit(dto.isAllowPartialCredit());
                ro.setQuestion(question);
                option = ro;
            }
            default -> throw new ValidationException("Unsupported question type: " + type);
        }

        return optionRepository.save(option);
    }

    private void updateOptions(Question question, List<OptionRequestDTO> optionDTOs) {
        optionRepository.deleteAll(question.getOptions());
        question.getOptions().clear();

        for (OptionRequestDTO dto : optionDTOs) {
            createOption(question, dto, question.getType());
        }
    }

    private void createOptionCopy(Option original, Question targetQuestion) {
        Option copy;

        if (original instanceof MultipleChoiceOption) {
            copy = new MultipleChoiceOption();
        } else if (original instanceof SingleChoiceOption) {
            copy = new SingleChoiceOption();
        } else if (original instanceof TrueFalseOption) {
            copy = new TrueFalseOption();
        } else if (original instanceof FillInTheBlankOption) {
            FillInTheBlankOption fbo = new FillInTheBlankOption();
            fbo.setCorrectAnswer(((FillInTheBlankOption) original).getCorrectAnswer());
            copy = fbo;
        } else if (original instanceof MatchingOption) {
            MatchingOption mo = new MatchingOption();
            mo.setLeftItem(((MatchingOption) original).getLeftItem());
            mo.setRightItem(((MatchingOption) original).getRightItem());
            copy = mo;
        } else if (original instanceof OrderingOption) {
            OrderingOption oo = new OrderingOption();
            oo.setItem(((OrderingOption) original).getItem());
            copy = oo;
        } else if (original instanceof DragDropOption) {
            DragDropOption ddo = new DragDropOption();
            ddo.setDraggableItem(((DragDropOption) original).getDraggableItem());
            ddo.setDropZoneId(((DragDropOption) original).getDropZoneId());
            copy = ddo;
        } else if (original instanceof ShortAnswerOption) {
            ShortAnswerOption sao = new ShortAnswerOption();
            sao.setExpectedAnswer(((ShortAnswerOption) original).getExpectedAnswer());
            copy = sao;
        } else if (original instanceof EssayOption) {
            EssayOption eo = new EssayOption();
            eo.setMinWords(((EssayOption) original).getMinWords());
            eo.setMaxWords(((EssayOption) original).getMaxWords());
            copy = eo;
        } else {
            copy = new MultipleChoiceOption();
        }

        copy.setText(original.getText());
        copy.setImageUrl(original.getImageUrl());
        copy.setCorrect(original.isCorrect());
        copy.setMatchKey(original.getMatchKey());
        copy.setOrderIndex(original.getOrderIndex());
        copy.setExplanation(original.getExplanation());
        copy.setQuestion(targetQuestion);

        optionRepository.save(copy);
    }

    private void validateQuestionRequest(QuestionRequestDTO request) {
        if (request.getQuestionText() == null || request.getQuestionText().isBlank()) {
            throw new ValidationException("Question text is required");
        }
        if (request.getQuestionType() == null) {
            throw new ValidationException("Question type is required");
        }
        if (request.getOptions() == null || request.getOptions().isEmpty()) {
            throw new ValidationException("Options cannot be empty");
        }

        QuestionType questionType = QuestionType.valueOf(request.getQuestionType());
        validateQuestionTypeSpecific(request, questionType);
    }

    private void validateQuestionTypeSpecific(QuestionRequestDTO request, QuestionType type) {
        switch (type) {
            case MULTIPLE_CHOICE -> {
                long correctCount = request.getOptions().stream().filter(OptionRequestDTO::isCorrect).count();
                if (correctCount == 0) {
                    throw new ValidationException("Multiple choice must have at least 1 correct option");
                }
            }
            case SINGLE_CHOICE -> {
                long correctCount = request.getOptions().stream().filter(OptionRequestDTO::isCorrect).count();
                if (correctCount != 1) {
                    throw new ValidationException("Single choice must have exactly 1 correct option");
                }
                if (request.getOptions().size() < 2) {
                    throw new ValidationException("Single choice must have at least 2 options");
                }
            }
            case TRUE_FALSE -> {
                if (request.getOptions().size() != 2) {
                    throw new ValidationException("True/False must have exactly 2 options");
                }
            }
            case FILL_IN_THE_BLANK -> {
                if (request.getOptions().isEmpty()) {
                    throw new ValidationException("Fill-in-blank must have answer(s)");
                }
            }
            case MATCHING -> {
                if (request.getOptions().size() < 2) {
                    throw new ValidationException("Matching must have at least 2 pairs");
                }
            }
            case ORDERING -> {
                if (request.getOptions().size() < 2) {
                    throw new ValidationException("Ordering must have at least 2 items");
                }
            }
            default -> {}
        }
    }

    private void validateUpdateRequest(QuestionUpdateRequest request) {
        if (request.getQuestionText() != null && request.getQuestionText().isBlank()) {
            throw new ValidationException("Question text cannot be empty");
        }
        if (request.getOptions() != null && request.getOptions().isEmpty()) {
            throw new ValidationException("Options cannot be empty");
        }
    }

    private String uploadImage(MultipartFile file) {
        try {
            validateImageFile(file);
            return fileUploadService.uploadImageToCloudinary(file);
        } catch (Exception e) {
            throw new ValidationException("Image upload failed: " + e.getMessage());
        }
    }

    private void validateImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            throw new ValidationException("Only JPEG or PNG images allowed");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ValidationException("Image size exceeds 5MB limit");
        }
    }

    private void markRichContentFlags(Question question, QuestionRequestDTO request) {
        String text = question.getQuestionText();
        question.setHasLatex(text != null && text.contains("$"));
        question.setHasCode(text != null && text.contains("```"));
        question.setHasTable(text != null && text.contains("<table>"));
        question.setHasVideo(text != null && text.contains("<iframe") && text.contains("youtube"));
        question.setHasAudio(text != null && text.contains("<audio>"));
    }

    private QuestionResponseDTO mapToResponseDTO(Question question) {
        QuestionResponseDTO dto = QuestionResponseDTO.builder()
                .questionId(question.getQuestionId())
                .quizId(question.getQuiz().getQuizId())
                .questionText(question.getQuestionText())
                .questionType(question.getType().toString())
                .imageUrl(question.getImageUrl())
                .timeLimitSeconds(question.getTimeLimitSeconds())
                .points(question.getPoints())
                .orderIndex(question.getOrderIndex())
                .explanation(question.getExplanation())
                .hint(question.getHint())
                .difficulty(question.getDifficulty())
                .tags(parseJsonList(question.getTagsJson()))
                .shuffleOptions(question.isShuffleOptions())
                .caseInsensitive(question.isCaseInsensitive())
                .partialCredit(question.isPartialCredit())
                .allowMultipleCorrect(question.isAllowMultipleCorrect())
                .answerVariations(parseJsonList(question.getAnswerVariationsJson()))
                .deleted(question.isDeleted())
                .deletedAt(question.getDeletedAt())
                .deletedBy(question.getDeletedBy())
                .createdBy(question.getCreatedBy())
                .updatedBy(question.getUpdatedBy())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .version(question.getVersion())
                .totalAttempts(question.getTotalAttempts())
                .correctAttempts(question.getCorrectAttempts())
                .passRate(question.getPassRate())
                .averageTimeSeconds(question.getAverageTimeSeconds())
                .difficultyIndex(question.getDifficultyIndex())
                .discriminationIndex(question.getDiscriminationIndex())
                .hasLatex(question.isHasLatex())
                .hasCode(question.isHasCode())
                .hasTable(question.isHasTable())
                .hasVideo(question.isHasVideo())
                .hasAudio(question.isHasAudio())
                .build();

        dto.setOptions(question.getOptions().stream()
                .map(this::mapOptionToDTO)
                .collect(Collectors.toList()));

        return dto;
    }

    private OptionResponseDTO mapOptionToDTO(Option option) {
        OptionResponseDTO dto = OptionResponseDTO.builder()
                .optionId(option.getOptionId())
                .text(option.getText())
                .imageUrl(option.getImageUrl())
                .correct(option.isCorrect())
                .matchKey(option.getMatchKey())
                .orderIndex(option.getOrderIndex())
                .explanation(option.getExplanation())
                .build();

        if (option instanceof FillInTheBlankOption) {
            FillInTheBlankOption fbo = (FillInTheBlankOption) option;
            dto.setCorrectAnswer(fbo.getCorrectAnswer());
            dto.setAcceptedVariations(fbo.getAcceptedVariations());
            dto.setTypoTolerance(fbo.getTypoTolerance());
        } else if (option instanceof MatchingOption) {
            MatchingOption mo = (MatchingOption) option;
            dto.setLeftItem(mo.getLeftItem());
            dto.setRightItem(mo.getRightItem());
            dto.setCorrectMatchKey(mo.getCorrectMatchKey());
        } else if (option instanceof OrderingOption) {
            OrderingOption oo = (OrderingOption) option;
            dto.setItem(oo.getItem());
            dto.setCorrectPosition(oo.getCorrectPosition());
        } else if (option instanceof DragDropOption) {
            DragDropOption ddo = (DragDropOption) option;
            dto.setDraggableItem(ddo.getDraggableItem());
            dto.setDropZoneId(ddo.getDropZoneId());
            dto.setDropZoneLabel(ddo.getDropZoneLabel());
            dto.setDragImageUrl(ddo.getDragImageUrl());
        } else if (option instanceof ShortAnswerOption) {
            ShortAnswerOption sao = (ShortAnswerOption) option;
            dto.setExpectedAnswer(sao.getExpectedAnswer());
            dto.setRequiredKeywords(parseJsonList(sao.getRequiredKeywords()));
            dto.setOptionalKeywords(parseJsonList(sao.getOptionalKeywords()));
            dto.setPartialCreditPercentage(sao.getPartialCreditPercentage());
        } else if (option instanceof EssayOption) {
            EssayOption eo = (EssayOption) option;
            dto.setMinWords(eo.getMinWords());
            dto.setMaxWords(eo.getMaxWords());
            dto.setSampleAnswer(eo.getSampleAnswer());
            dto.setEnablePlagiarismCheck(eo.isEnablePlagiarismCheck());
        } else if (option instanceof HotspotOption) {
            HotspotOption ho = (HotspotOption) option;
            dto.setHotspotLabel(ho.getHotspotLabel());
        } else if (option instanceof ImageSelectionOption) {
            ImageSelectionOption iso = (ImageSelectionOption) option;
            dto.setImageLabel(iso.getImageLabel());
            dto.setThumbnailUrl(iso.getThumbnailUrl());
        } else if (option instanceof DropdownOption) {
            DropdownOption dro = (DropdownOption) option;
            dto.setDropdownValue(dro.getDropdownValue());
            dto.setDisplayLabel(dro.getDisplayLabel());
            dto.setPlaceholder(dro.getPlaceholder());
        } else if (option instanceof MatrixOption) {
            MatrixOption mao = (MatrixOption) option;
            dto.setRowId(mao.getRowId());
            dto.setColumnId(mao.getColumnId());
            dto.setRowLabel(mao.getRowLabel());
            dto.setColumnLabel(mao.getColumnLabel());
            dto.setCellValue(mao.getCellValue());
            dto.setCorrectCell(mao.isCorrectCell());
        } else if (option instanceof RankingOption) {
            RankingOption ro = (RankingOption) option;
            dto.setRankableItem(ro.getRankableItem());
            dto.setCorrectRank(ro.getCorrectRank());
            dto.setRankingScale(ro.getRankingScale());
            dto.setAllowPartialCredit(ro.isAllowPartialCredit());
        }

        return dto;
    }

    private QuestionResponseDTO createQuestionFromCSV(String questionText, String questionType, CSVRecord record, Quiz quiz, UUID userId) {
        QuestionRequestDTO request = QuestionRequestDTO.builder()
                .quizId(quiz.getQuizId())
                .questionText(questionText)
                .questionType(questionType)
                .build();

        // Parse options from CSV (simplified for common types)
        List<OptionRequestDTO> options = new ArrayList<>();
        for (int i = 2; i <= 5; i++) {
            if (i < record.size() && !record.get(i).isBlank()) {
                options.add(OptionRequestDTO.builder()
                        .text(record.get(i))
                        .build());
            }
        }
        request.setOptions(options);

        return addQuestion(request, userId);
    }

    private String toJsonArray(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.equals("[]")) return new ArrayList<>();
        try {
            return Arrays.asList(objectMapper.readValue(json, String[].class));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}