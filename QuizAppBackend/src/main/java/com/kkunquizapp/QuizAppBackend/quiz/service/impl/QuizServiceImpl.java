package com.kkunquizapp.QuizAppBackend.quiz.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.question.repository.OptionRepo;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.quiz.dto.*;
import com.kkunquizapp.QuizAppBackend.quiz.event.QuizEvent;
import com.kkunquizapp.QuizAppBackend.quiz.exception.QuizNotFoundException;
import com.kkunquizapp.QuizAppBackend.quiz.exception.UnauthorizedException;
import com.kkunquizapp.QuizAppBackend.quiz.exception.ValidationException;
import com.kkunquizapp.QuizAppBackend.quiz.mapper.QuizMapper;
import com.kkunquizapp.QuizAppBackend.quiz.model.*;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Difficulty;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Visibility;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.quiz.service.QuizService;
import com.kkunquizapp.QuizAppBackend.redis.service.RedisService;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
@Slf4j
public class QuizServiceImpl implements QuizService {

    private final QuizRepo quizRepo;
    private final QuestionRepo questionRepo;
    private final OptionRepo optionRepo;
    private final UserRepo userRepo;
    private final QuizMapper quizMapper;
    private final RedisService redisService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==================== CREATE QUIZ ====================

    @Override
    public QuizDetailResponse createQuiz(QuizCreateRequest request, UUID creatorId) {
        log.info("Creating quiz for user: {}", creatorId);

        // Validate user exists
        User creator = userRepo.findById(creatorId)
                .orElseThrow(() -> {
                    log.error("User not found: {}", creatorId);
                    return new QuizNotFoundException("User not found");
                });

        // Validate request
        validateCreateRequest(request);

        // Generate unique slug
        String slug = generateUniqueSlug(request.getTitle());

        // Encode password if PASSWORD visibility
        String encodedPassword = null;
        if (request.getVisibility() == Visibility.PASSWORD && request.getAccessPassword() != null) {
            validatePasswordStrength(request.getAccessPassword());
            encodedPassword = passwordEncoder.encode(request.getAccessPassword());
        }

        Quiz quiz = Quiz.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .slug(slug)
                .coverImageUrl(request.getCoverImageUrl())
                .creator(creator)
                .tagsJson(toJsonArray(request.getTags()))
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : Difficulty.MEDIUM)
                .estimatedMinutes(request.getEstimatedMinutes() != null ? request.getEstimatedMinutes() : 10)
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PUBLIC)
                .accessPassword(encodedPassword)
                .allowedUserIdsJson("[]")
                .published(false)
                .deleted(false)
                .totalQuestions(0)
                .totalSessions(0)
                .totalLivePlays(0)
                .averageScore(0.0)
                .averageTimeSpent(0)
                .viewCount(0)
                .startCount(0)
                .completionCount(0)
                .createdBy(creatorId)
                .updatedBy(creatorId)
                .build();

        quiz = quizRepo.save(quiz);
        log.info("Quiz created successfully: {}", quiz.getQuizId());

        // Cache vào Redis
        redisService.saveQuiz(quiz.getQuizId(), quiz);

        // Gửi event Kafka
        kafkaTemplate.send("quiz.events", new QuizEvent(quiz.getQuizId(), "QUIZ_CREATED", creatorId));

        return quizMapper.toDetailDto(quiz);
    }

    // ==================== READ QUIZ ====================

    @Override
    @Cacheable(value = "quizDetail", key = "#slug", unless = "#result == null")
    public QuizDetailResponse getQuizDetailBySlug(String slug, UUID userId, String password) {
        log.info("Fetching quiz by slug: {}", slug);

        Quiz quiz = quizRepo.findBySlugAndDeletedFalse(slug)
                .orElseThrow(() -> {
                    log.warn("Quiz not found with slug: {}", slug);
                    return new QuizNotFoundException("Quiz not found");
                });

        // Validate access
        validateAccess(quiz, userId, password);

        // Load questions + options
        List<Question> questions = questionRepo.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(quiz.getQuizId());
        quiz.setQuestions(questions);

        boolean isOwner = userId != null && quiz.getCreator().getUserId().equals(userId);

        QuizDetailResponse response = quizMapper.toDetailDto(quiz);

        // Ẩn đáp án đúng khi chơi (nếu không phải owner)
        if (!isOwner) {
            response.getQuestions().forEach(q ->
                    q.getOptions().forEach(opt -> opt.setCorrect(null))
            );
        }

        response.setOwner(isOwner);
        response.setCanPlay(true);

        // Increment view count
        incrementViewCount(quiz.getQuizId());

        return response;
    }

    @Override
    public QuizDetailResponse getQuizDetailById(UUID quizId, UUID userId) {
        log.info("Fetching quiz by ID: {}", quizId);

        Quiz quiz = quizRepo.findByQuizIdAndDeletedFalse(quizId)
                .orElseThrow(() -> {
                    log.warn("Quiz not found with ID: {}", quizId);
                    return new QuizNotFoundException("Quiz not found");
                });

        boolean isOwner = userId != null && quiz.getCreator().getUserId().equals(userId);

        // Check visibility
        if (!isOwner && quiz.getVisibility() == Visibility.PRIVATE) {
            log.warn("Access denied to private quiz: {} by user: {}", quizId, userId);
            throw new UnauthorizedException("Quiz is private");
        }

        // Load questions
        List<Question> questions = questionRepo.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(quizId);
        quiz.setQuestions(questions);

        QuizDetailResponse response = quizMapper.toDetailDto(quiz);

        // Ẩn đáp án nếu không phải owner
        if (!isOwner) {
            response.getQuestions().forEach(q ->
                    q.getOptions().forEach(opt -> opt.setCorrect(null))
            );
        }

        response.setOwner(isOwner);
        response.setCanPlay(true);

        return response;
    }

    @Override
    public Page<QuizSummaryDto> getPublicQuizzes(String keyword, Pageable pageable) {
        log.info("Fetching public quizzes, keyword: {}", keyword);

        Page<Quiz> page = (keyword == null || keyword.isBlank())
                ? quizRepo.findByPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(pageable)
                : quizRepo.searchPublicQuizzes(keyword.trim(), pageable);

        return page.map(quizMapper::toSummaryDto);
    }

    @Override
    public Page<QuizSummaryDto> getMyQuizzes(UUID userId, Pageable pageable) {
        log.info("Fetching quizzes for user: {}", userId);

        validateUserExists(userId);

        return quizRepo.findByCreatorUserIdAndDeletedFalseOrderByCreatedAtDesc(userId, pageable)
                .map(quizMapper::toSummaryDto);
    }

    @Override
    public Page<QuizSummaryDto> getMyDrafts(UUID userId, Pageable pageable) {
        log.info("Fetching drafts for user: {}", userId);

        validateUserExists(userId);

        return quizRepo.findByCreatorUserIdAndPublishedFalseAndDeletedFalseOrderByCreatedAtDesc(userId, pageable)
                .map(quizMapper::toSummaryDto);
    }

    @Override
    public Page<QuizSummaryDto> getTrendingQuizzes(Pageable pageable) {
        log.info("Fetching trending quizzes");

        return quizRepo.findTrendingQuizzes(pageable)
                .map(quizMapper::toSummaryDto);
    }

    @Override
    public Page<QuizSummaryDto> getQuizzesByDifficulty(String difficulty, Pageable pageable) {
        log.info("Fetching quizzes by difficulty: {}", difficulty);

        return quizRepo.findByPublishedTrueAndDeletedFalseAndDifficulty(difficulty, pageable)
                .map(quizMapper::toSummaryDto);
    }

    @Override
    public Page<QuizSummaryDto> getQuizzesByCategory(Integer categoryId, Pageable pageable) {
        log.info("Fetching quizzes by category: {}", categoryId);

        return quizRepo.findByPublishedTrueAndDeletedFalseAndCategoryId(categoryId, pageable)
                .map(quizMapper::toSummaryDto);
    }

    @Override
    public Page<QuizSummaryDto> searchQuizzes(String keyword, String difficulty, Integer categoryId, Pageable pageable) {
        log.info("Searching quizzes: keyword={}, difficulty={}, category={}", keyword, difficulty, categoryId);

        return quizRepo.searchQuizzesAdvanced(keyword, difficulty, categoryId, pageable)
                .map(quizMapper::toSummaryDto);
    }

    @Override
    public Page<QuizSummaryDto> getPopularByCategory(Integer categoryId, Pageable pageable) {
        log.info("Fetching popular quizzes by category: {}", categoryId);

        return quizRepo.getPopularQuizzesByCategory(categoryId, pageable)
                .map(quizMapper::toSummaryDto);
    }

    // ==================== UPDATE QUIZ ====================

    @Override
    @CacheEvict(value = "quizDetail", key = "#quizId")
    public QuizDetailResponse updateQuiz(UUID quizId, QuizUpdateRequest request, UUID userId) {
        log.info("Updating quiz: {} by user: {}", quizId, userId);

        Quiz quiz = quizRepo.findByQuizIdAndCreatorUserIdAndDeletedFalse(quizId, userId)
                .orElseThrow(() -> {
                    log.error("Quiz not found or not owner: {}", quizId);
                    return new UnauthorizedException("Quiz not found or you are not the owner");
                });

        // Validate request
        validateUpdateRequest(request);

        // Check if quiz is locked (has active sessions)
        if (hasActiveSessions(quizId)) {
            log.warn("Cannot update quiz with active sessions: {}", quizId);
            throw new ValidationException("Cannot update quiz with active sessions");
        }

        quiz.setTitle(request.getTitle().trim());
        quiz.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        quiz.setCoverImageUrl(request.getCoverImageUrl());
        quiz.setTagsJson(toJsonArray(request.getTags()));
        quiz.setDifficulty(request.getDifficulty());
        quiz.setEstimatedMinutes(request.getEstimatedMinutes());
        quiz.setVisibility(request.getVisibility());

        // Update password if visibility is PASSWORD
        if (request.getVisibility() == Visibility.PASSWORD && request.getAccessPassword() != null) {
            validatePasswordStrength(request.getAccessPassword());
            quiz.setAccessPassword(passwordEncoder.encode(request.getAccessPassword()));
        } else if (request.getVisibility() != Visibility.PASSWORD) {
            quiz.setAccessPassword(null);
        }

        // Update allowed users if PRIVATE
        if (request.getVisibility() == Visibility.PRIVATE && request.getAllowedUserIds() != null) {
            quiz.setAllowedUserIdsJson(toJsonArray(
                    request.getAllowedUserIds().stream().map(UUID::toString).collect(Collectors.toList())
            ));
        }

        // Update slug only if quiz has no sessions
        if (quiz.getTotalSessions() == 0 && quiz.getTotalLivePlays() == 0) {
            quiz.setSlug(generateUniqueSlug(request.getTitle()));
        }

        quiz.setUpdatedBy(userId);
        quiz.setUpdatedAt(LocalDateTime.now());
        quiz = quizRepo.save(quiz);

        log.info("Quiz updated successfully: {}", quizId);
        redisService.evictQuiz(quiz.getQuizId());

        return quizMapper.toDetailDto(quiz);
    }

    // ==================== PUBLISH/UNPUBLISH QUIZ ====================

    @Override
    @CacheEvict(value = "quizDetail", key = "#quizId")
    public void publishQuiz(UUID quizId, UUID userId) {
        log.info("Publishing quiz: {} by user: {}", quizId, userId);

        Quiz quiz = quizRepo.findByQuizIdAndCreatorUserIdAndDeletedFalse(quizId, userId)
                .orElseThrow(() -> new UnauthorizedException("Quiz not found or not owner"));

        // Validate publication requirements
        int questionCount = questionRepo.countByQuizQuizIdAndDeletedFalse(quizId);
        if (questionCount < 3) {
            log.warn("Quiz has insufficient questions: {}", questionCount);
            throw new ValidationException("Quiz must have at least 3 questions to publish");
        }

        if (quiz.isPublished()) {
            log.warn("Quiz already published: {}", quizId);
            throw new ValidationException("Quiz is already published");
        }

        quiz.setPublished(true);
        quiz.setTotalQuestions(questionCount);
        quiz.setUpdatedBy(userId);
        quiz.setUpdatedAt(LocalDateTime.now());
        quizRepo.save(quiz);

        log.info("Quiz published successfully: {}", quizId);

        // Send Kafka event
        kafkaTemplate.send("quiz.events", new QuizEvent(quizId, "QUIZ_PUBLISHED", userId));
        redisService.evictQuiz(quizId);
    }

    @Override
    @CacheEvict(value = "quizDetail", key = "#quizId")
    public void unpublishQuiz(UUID quizId, UUID userId) {
        log.info("Unpublishing quiz: {} by user: {}", quizId, userId);

        Quiz quiz = quizRepo.findByQuizIdAndCreatorUserIdAndDeletedFalse(quizId, userId)
                .orElseThrow(() -> new UnauthorizedException("Quiz not found or not owner"));

        if (!quiz.isPublished()) {
            throw new ValidationException("Quiz is not published");
        }

        quiz.setPublished(false);
        quiz.setUpdatedBy(userId);
        quiz.setUpdatedAt(LocalDateTime.now());
        quizRepo.save(quiz);

        log.info("Quiz unpublished successfully: {}", quizId);
        redisService.evictQuiz(quizId);
    }

    // ==================== DELETE QUIZ ====================

    @Override
    @CacheEvict(value = "quizDetail", key = "#quizId")
    public void softDeleteQuiz(UUID quizId, UUID userId) {
        log.info("Soft deleting quiz: {} by user: {}", quizId, userId);

        Quiz quiz = quizRepo.findByQuizIdAndCreatorUserIdAndDeletedFalse(quizId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not owner or quiz already deleted"));

        quiz.setDeleted(true);
        quiz.setDeletedAt(LocalDateTime.now());
        quiz.setDeletedBy(userId);
        quiz.setUpdatedBy(userId);
        quiz.setUpdatedAt(LocalDateTime.now());
        quizRepo.save(quiz);

        log.info("Quiz soft deleted successfully: {}", quizId);
        redisService.evictQuiz(quizId);

        kafkaTemplate.send("quiz.events", new QuizEvent(quizId, "QUIZ_DELETED", userId));
    }

    @Override
    public void hardDeleteQuiz(UUID quizId, UUID userId) {
        log.info("Hard deleting quiz: {} by user: {}", quizId, userId);

        Quiz quiz = quizRepo.findByQuizIdAndCreatorUserIdAndDeletedFalse(quizId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not owner"));

        // Delete all questions and options (cascade)
        questionRepo.deleteByQuizQuizId(quizId);

        // Delete quiz
        quizRepo.delete(quiz);

        log.info("Quiz hard deleted successfully: {}", quizId);
        redisService.evictQuiz(quizId);
    }

    @Override
    public void restoreQuiz(UUID quizId, UUID userId) {
        log.info("Restoring quiz: {} by user: {}", quizId, userId);

        Quiz quiz = quizRepo.findByQuizIdAndCreatorUserId(quizId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not owner"));

        if (!quiz.isDeleted()) {
            throw new ValidationException("Quiz is not deleted");
        }

        quiz.setDeleted(false);
        quiz.setDeletedAt(null);
        quiz.setDeletedBy(null);
        quiz.setUpdatedBy(userId);
        quiz.setUpdatedAt(LocalDateTime.now());
        quizRepo.save(quiz);

        log.info("Quiz restored successfully: {}", quizId);
        redisService.evictQuiz(quizId);
    }

    // ==================== DUPLICATE QUIZ ====================

    @Override
    public QuizDetailResponse duplicateQuiz(UUID quizId, UUID userId) {
        log.info("Duplicating quiz: {} by user: {}", quizId, userId);

        Quiz original = quizRepo.findByQuizIdAndDeletedFalse(quizId)
                .orElseThrow(() -> new QuizNotFoundException("Quiz not found"));

        User creator = userRepo.findById(userId)
                .orElseThrow(() -> new QuizNotFoundException("User not found"));

        // Create copy
        String newSlug = generateUniqueSlug(original.getTitle() + " copy");

        Quiz copy = Quiz.builder()
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .slug(newSlug)
                .creator(creator)
                .coverImageUrl(original.getCoverImageUrl())
                .tagsJson(original.getTagsJson())
                .difficulty(original.getDifficulty())
                .estimatedMinutes(original.getEstimatedMinutes())
                .visibility(Visibility.PRIVATE)
                .published(false)
                .deleted(false)
                .totalQuestions(0)
                .totalSessions(0)
                .totalLivePlays(0)
                .averageScore(0.0)
                .averageTimeSpent(0)
                .viewCount(0)
                .startCount(0)
                .completionCount(0)
                .createdBy(userId)
                .updatedBy(userId)
                .build();

        copy = quizRepo.save(copy);
        log.info("Quiz copy created: {}", copy.getQuizId());

        // Copy all questions with options
        List<Question> originalQuestions = questionRepo.findByQuizQuizIdAndDeletedFalse(original.getQuizId());

        int questionCount = 0;
        for (Question originalQuestion : originalQuestions) {
            try {
                duplicateQuestion(originalQuestion, copy, userId);
                questionCount++;
                log.debug("Question copied: {} to {}", originalQuestion.getQuestionId(), copy.getQuizId());
            } catch (Exception e) {
                log.error("Error copying question: {}", e.getMessage());
            }
        }

        copy.setTotalQuestions(questionCount);
        copy.setUpdatedAt(LocalDateTime.now());
        copy = quizRepo.save(copy);

        log.info("Quiz with {} questions duplicated successfully", questionCount);
        kafkaTemplate.send("quiz.events", new QuizEvent(copy.getQuizId(), "QUIZ_DUPLICATED", userId));

        return quizMapper.toDetailDto(copy);
    }

    // Helper method to duplicate a question
    private Question duplicateQuestion(Question original, Quiz targetQuiz, UUID userId) {
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

        copy = questionRepo.save(copy);

        // Copy all options
        for (Option originalOption : original.getOptions()) {
            duplicateOption(originalOption, copy);
        }

        return copy;
    }

    // Helper method to duplicate options based on type
    private void duplicateOption(Option original, Question targetQuestion) {
        Option copy;

        switch (targetQuestion.getType()) {
            case SINGLE_CHOICE -> {
                copy = new SingleChoiceOption();
            }
            case MULTIPLE_CHOICE -> {
                copy = new MultipleChoiceOption();
            }
            case TRUE_FALSE -> {
                copy = new TrueFalseOption();
            }
            case FILL_IN_THE_BLANK -> {
                FillInTheBlankOption fbo = (FillInTheBlankOption) original;
                FillInTheBlankOption fboCopy = new FillInTheBlankOption();
                fboCopy.setCorrectAnswer(fbo.getCorrectAnswer());
                fboCopy.setCaseInsensitive(fbo.isCaseInsensitive());
                fboCopy.setAcceptedVariations(fbo.getAcceptedVariations());
                fboCopy.setTypoTolerance(fbo.getTypoTolerance());
                copy = fboCopy;
            }
            case MATCHING -> {
                MatchingOption mo = (MatchingOption) original;
                MatchingOption moCopy = new MatchingOption();
                moCopy.setLeftItem(mo.getLeftItem());
                moCopy.setRightItem(mo.getRightItem());
                moCopy.setCorrectMatchKey(mo.getCorrectMatchKey());
                moCopy.setAcceptedMatches(mo.getAcceptedMatches());
                copy = moCopy;
            }
            case ORDERING -> {
                OrderingOption oo = (OrderingOption) original;
                OrderingOption ooCopy = new OrderingOption();
                ooCopy.setItem(oo.getItem());
                ooCopy.setCorrectPosition(oo.getCorrectPosition());
                ooCopy.setAcceptedPositions(oo.getAcceptedPositions());
                copy = ooCopy;
            }
            case DRAG_DROP -> {
                DragDropOption ddo = (DragDropOption) original;
                DragDropOption ddoCopy = new DragDropOption();
                ddoCopy.setDraggableItem(ddo.getDraggableItem());
                ddoCopy.setDropZoneId(ddo.getDropZoneId());
                ddoCopy.setDropZoneLabel(ddo.getDropZoneLabel());
                ddoCopy.setDragImageUrl(ddo.getDragImageUrl());
                ddoCopy.setCorrectDropZones(ddo.getCorrectDropZones());
                copy = ddoCopy;
            }
            case SHORT_ANSWER -> {
                ShortAnswerOption sao = (ShortAnswerOption) original;
                ShortAnswerOption saoCopy = new ShortAnswerOption();
                saoCopy.setExpectedAnswer(sao.getExpectedAnswer());
                saoCopy.setRequiredKeywords(sao.getRequiredKeywords());
                saoCopy.setOptionalKeywords(sao.getOptionalKeywords());
                saoCopy.setCaseInsensitive(sao.isCaseInsensitive());
                saoCopy.setPartialCreditPercentage(sao.getPartialCreditPercentage());
                copy = saoCopy;
            }
            case ESSAY -> {
                EssayOption eo = (EssayOption) original;
                EssayOption eoCopy = new EssayOption();
                eoCopy.setRubricCriteria(eo.getRubricCriteria());
                eoCopy.setMinWords(eo.getMinWords());
                eoCopy.setMaxWords(eo.getMaxWords());
                eoCopy.setRequiresManualGrading(eo.isRequiresManualGrading());
                eoCopy.setSampleAnswer(eo.getSampleAnswer());
                eoCopy.setEnablePlagiarismCheck(eo.isEnablePlagiarismCheck());
                copy = eoCopy;
            }
            case HOTSPOT -> {
                HotspotOption ho = (HotspotOption) original;
                HotspotOption hoCopy = new HotspotOption();
                hoCopy.setImageUrl(ho.getImageUrl());
                hoCopy.setHotspotCoordinates(ho.getHotspotCoordinates());
                hoCopy.setHotspotLabel(ho.getHotspotLabel());
                hoCopy.setValidHotspots(ho.getValidHotspots());
                copy = hoCopy;
            }
            case IMAGE_SELECTION -> {
                ImageSelectionOption iso = (ImageSelectionOption) original;
                ImageSelectionOption isoCopy = new ImageSelectionOption();
                isoCopy.setImageUrl(iso.getImageUrl());
                isoCopy.setImageLabel(iso.getImageLabel());
                isoCopy.setThumbnailUrl(iso.getThumbnailUrl());
                copy = isoCopy;
            }
            case DROPDOWN -> {
                DropdownOption dro = (DropdownOption) original;
                DropdownOption droCopy = new DropdownOption();
                droCopy.setDropdownValue(dro.getDropdownValue());
                droCopy.setDisplayLabel(dro.getDisplayLabel());
                droCopy.setPlaceholder(dro.getPlaceholder());
                copy = droCopy;
            }
            case MATRIX -> {
                MatrixOption mao = (MatrixOption) original;
                MatrixOption maoCopy = new MatrixOption();
                maoCopy.setRowId(mao.getRowId());
                maoCopy.setColumnId(mao.getColumnId());
                maoCopy.setRowLabel(mao.getRowLabel());
                maoCopy.setColumnLabel(mao.getColumnLabel());
                maoCopy.setCellValue(mao.getCellValue());
                maoCopy.setCorrectCell(mao.isCorrectCell());
                copy = maoCopy;
            }
            case RANKING -> {
                RankingOption ro = (RankingOption) original;
                RankingOption roCopy = new RankingOption();
                roCopy.setRankableItem(ro.getRankableItem());
                roCopy.setCorrectRank(ro.getCorrectRank());
                roCopy.setRankingScale(ro.getRankingScale());
                roCopy.setAllowPartialCredit(ro.isAllowPartialCredit());
                copy = roCopy;
            }
            default -> {
                log.warn("Unknown question type: {}, defaulting to MultipleChoiceOption", targetQuestion.getType());
                copy = new MultipleChoiceOption();
            }
        }

        // Copy common fields
        copy.setText(original.getText());
        copy.setImageUrl(original.getImageUrl());
        copy.setCorrect(original.isCorrect());
        copy.setMatchKey(original.getMatchKey());
        copy.setOrderIndex(original.getOrderIndex());
        copy.setExplanation(original.getExplanation());
        copy.setExtraData(original.getExtraData());
        copy.setQuestion(targetQuestion);

        optionRepo.save(copy);
    }

    // ==================== QUIZ ANALYTICS & TRACKING ====================

    @Override
    public void incrementPlayCount(UUID quizId) {
        log.debug("Incrementing play count for quiz: {}", quizId);
        quizRepo.incrementPlayCount(quizId);
        redisService.evictQuiz(quizId);
    }

    @Override
    public void incrementViewCount(UUID quizId) {
        log.debug("Incrementing view count for quiz: {}", quizId);
        quizRepo.incrementViewCount(quizId);
    }

    @Override
    public void incrementStartCount(UUID quizId) {
        log.debug("Incrementing start count for quiz: {}", quizId);
        quizRepo.incrementStartCount(quizId);
    }

    @Override
    public void incrementCompletionCount(UUID quizId) {
        log.debug("Incrementing completion count for quiz: {}", quizId);
        quizRepo.incrementCompletionCount(quizId);
    }

    @Override
    public void updateAverageScore(UUID quizId, double score) {
        log.debug("Updating average score for quiz: {} with score: {}", quizId, score);
        quizRepo.updateAverageScore(quizId, score);
        redisService.evictQuiz(quizId);
    }

    // ==================== HELPER METHODS ====================

    private void validateCreateRequest(QuizCreateRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ValidationException("Quiz title is required");
        }
        if (request.getTitle().length() > 200) {
            throw new ValidationException("Quiz title must not exceed 200 characters");
        }
        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            throw new ValidationException("Quiz description must not exceed 1000 characters");
        }
        if (request.getVisibility() == Visibility.PASSWORD &&
                (request.getAccessPassword() == null || request.getAccessPassword().isBlank())) {
            throw new ValidationException("Password is required for PASSWORD visibility");
        }
    }

    private void validateUpdateRequest(QuizUpdateRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ValidationException("Quiz title is required");
        }
        if (request.getTitle().length() > 200) {
            throw new ValidationException("Quiz title must not exceed 200 characters");
        }
        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            throw new ValidationException("Quiz description must not exceed 1000 characters");
        }
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 4) {
            throw new ValidationException("Password must be at least 4 characters");
        }
        if (password.length() > 100) {
            throw new ValidationException("Password must not exceed 100 characters");
        }
    }

    private void validateAccess(Quiz quiz, UUID userId, String password) {
        switch (quiz.getVisibility()) {
            case PUBLIC, UNLISTED -> {
                // No validation needed
            }
            case PRIVATE -> {
                if (userId == null || !quiz.getCreator().getUserId().equals(userId)) {
                    // Check if user is in allowed list
                    List<String> allowedIds = parseAllowedUserIds(quiz.getAllowedUserIdsJson());
                    if (!allowedIds.contains(userId != null ? userId.toString() : "")) {
                        log.warn("Access denied to private quiz for user: {}", userId);
                        throw new UnauthorizedException("Quiz is private");
                    }
                }
            }
            case PASSWORD -> {
                if (password == null || !passwordEncoder.matches(password, quiz.getAccessPassword())) {
                    log.warn("Incorrect password for quiz: {}", quiz.getQuizId());
                    throw new UnauthorizedException("Incorrect password");
                }
            }
        }
    }

    private String generateUniqueSlug(String title) {
        String base = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();

        if (base.isEmpty()) base = "quiz";
        if (base.length() > 80) base = base.substring(0, 80);

        String slug = base;
        int i = 1;
        while (quizRepo.existsBySlugAndDeletedFalse(slug)) {
            slug = base + "-" + i++;
        }
        return slug;
    }

    private String toJsonArray(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try {
            ArrayNode arrayNode = objectMapper.createArrayNode();
            list.forEach(arrayNode::add);
            return arrayNode.toString();
        } catch (Exception e) {
            log.warn("Error converting list to JSON array", e);
            return "[]";
        }
    }

    private List<String> parseAllowedUserIds(String json) {
        try {
            if (json == null || json.equals("[]")) return new ArrayList<>();
            return Arrays.asList(objectMapper.readValue(json, String[].class));
        } catch (Exception e) {
            log.warn("Error parsing allowed user IDs", e);
            return new ArrayList<>();
        }
    }

    private boolean hasActiveSessions(UUID quizId) {
        // TODO: Implement in QuizSessionRepository when sessions feature is ready
        // For now, always return false to allow updates
        return false;
    }

    private void validateUserExists(UUID userId) {
        if (!userRepo.existsById(userId)) {
            throw new QuizNotFoundException("User not found");
        }
    }
}