package com.kkunquizapp.QuizAppBackend.game.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.event.GameEvent;
import com.kkunquizapp.QuizAppBackend.game.exception.GameException;
import com.kkunquizapp.QuizAppBackend.game.exception.GameNotFoundException;
import com.kkunquizapp.QuizAppBackend.game.mapper.GameMapper;
import com.kkunquizapp.QuizAppBackend.game.model.*;
import com.kkunquizapp.QuizAppBackend.game.model.enums.*;
import com.kkunquizapp.QuizAppBackend.game.repository.GameParticipantRepo;
import com.kkunquizapp.QuizAppBackend.game.repository.GameRepo;
import com.kkunquizapp.QuizAppBackend.game.repository.UserAnswerRepo;
import com.kkunquizapp.QuizAppBackend.game.repository.UserQuizStatisticsRepo;
import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import com.kkunquizapp.QuizAppBackend.question.model.Question;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.quiz.service.QuizService;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Game Service Implementation - Production Ready
 *
 * Features:
 * - Thread-safe game operations using TaskScheduler
 * - Redis caching with proper serialization
 * - Kafka event streaming for real-time updates
 * - Distributed locking for idempotency
 * - Comprehensive error handling
 * - Transaction management
 * - Participant access validation (FIXED)
 * - Player count tracking - total + active (FIXED)
 * - Auto end game when no players (FIXED)
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
@Slf4j
public class GameServiceImpl implements GameService {

    // ==================== DEPENDENCIES ====================

    private final GameRepo gameRepository;
    private final GameParticipantRepo participantRepository;
    private final UserAnswerRepo answerRepository;
    private final UserQuizStatisticsRepo statsRepository;
    private final QuizRepo quizRepository;
    private final QuestionRepo questionRepository;
    private final UserRepo userRepository;
    private final QuizService quizService;
    private final GameMapper gameMapper;

    @Qualifier("redisObjectMapper")
    private final ObjectMapper redisObjectMapper;

    private final RedisTemplate<String, Object> redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final TaskScheduler taskScheduler;

    // ==================== CONSTANTS ====================

    private static final String GAME_CACHE_PREFIX = "game:";
    private static final String GAME_PIN_PREFIX = "game:pin:";
    private static final String LEADERBOARD_CACHE_PREFIX = "leaderboard:";
    private static final String PARTICIPANTS_CACHE_PREFIX = "participants:";
    private static final String ANSWER_LOCK_PREFIX = "answer:lock:";

    private static final long CACHE_TTL_SECONDS = 300;
    private static final long LEADERBOARD_TTL_SECONDS = 5;
    private static final long PARTICIPANTS_TTL_SECONDS = 60;

    @Value("${app.kafka.topics.game-events}")
    private String KAFKA_TOPIC;

    // ==================== CREATE GAME ====================

    @Override
    public GameResponseDTO createGame(GameCreateRequest request, UUID hostId) {
        log.info("Creating game for quiz: {} by host: {}", request.getQuizId(), hostId);

        Quiz quiz = quizRepository.findByQuizIdAndDeletedFalse(request.getQuizId())
                .orElseThrow(() -> new GameException("Quiz not found"));

        if (!quiz.isPublished()) {
            throw new GameException("Cannot create game for unpublished quiz");
        }

        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new GameException("Host not found"));

        List<Question> questions = questionRepository.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(quiz.getQuizId());
        if (questions.isEmpty()) {
            throw new GameException("Quiz has no questions");
        }

        String pinCode = generateUniquePinCode();

        Game game = Game.builder()
                .quiz(quiz)
                .host(host)
                .pinCode(pinCode)
                .gameStatus(GameStatus.WAITING)
                .maxPlayers(request.getMaxPlayers() != null ? request.getMaxPlayers() : 200)
                .allowAnonymous(request.isAllowAnonymous())
                .showLeaderboard(request.isShowLeaderboard())
                .randomizeQuestions(request.isRandomizeQuestions())
                .randomizeOptions(request.isRandomizeOptions())
                .totalQuestions(questions.size())
                .playerCount(0)
                .activePlayerCount(0)
                .completedPlayerCount(0)
                .currentQuestionIndex(-1)
                .settingsJson(toJsonString(request.getSettings()))
                .build();

        game = gameRepository.save(game);
        log.info("Game created: {} with PIN: {}", game.getGameId(), pinCode);

        cacheGame(game);

        publishGameEvent(game.getGameId(), "GAME_CREATED", hostId, Map.of(
                "pinCode", pinCode,
                "quizTitle", quiz.getTitle(),
                "totalQuestions", questions.size()
        ));

        quizService.incrementPlayCount(quiz.getQuizId());

        return gameMapper.toResponseDTO(game);
    }

    // ==================== JOIN GAME ====================

    @Override
    public GameParticipantDTO joinGame(String pinCode, JoinGameRequest request, UUID userId) {
        log.info("User {} joining game with PIN: {}", userId, pinCode);

        Game game = getGameByPinWithValidation(pinCode);
        validateGameJoinable(game);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GameException("User not found"));

        Optional<GameParticipant> existing = participantRepository.findByGameAndUser(game, user);
        if (existing.isPresent()) {
            GameParticipant participant = existing.get();
            if (participant.getStatus() == ParticipantStatus.LEFT) {
                participant.setStatus(ParticipantStatus.JOINED);
                participantRepository.save(participant);
            }
            return gameMapper.toParticipantDTO(participant);
        }

        GameParticipant participant = GameParticipant.builder()
                .game(game)
                .user(user)
                .nickname(request.getNickname() != null ? request.getNickname() : user.getUsername())
                .isAnonymous(false)
                .status(ParticipantStatus.JOINED)
                .score(0)
                .correctCount(0)
                .build();

        participant = participantRepository.save(participant);
        log.info("User {} joined game {}", userId, game.getGameId());

        updatePlayerCount(game, 1);

        publishGameEvent(game.getGameId(), "PARTICIPANT_JOINED", userId, Map.of(
                "participantId", participant.getParticipantId(),
                "nickname", participant.getNickname(),
                "isAnonymous", false,
                "playerCount", game.getPlayerCount()
        ));

        return gameMapper.toParticipantDTO(participant);
    }

    @Override
    public GameParticipantDTO joinGameAnonymous(String pinCode, JoinGameRequest request) {
        log.info("Anonymous user joining game with PIN: {}", pinCode);

        Game game = getGameByPinWithValidation(pinCode);
        validateGameJoinable(game);

        if (!game.isAllowAnonymous()) {
            throw new GameException("Anonymous players not allowed in this game");
        }

        if (request.getNickname() == null || request.getNickname().trim().isEmpty()) {
            throw new GameException("Nickname is required for anonymous players");
        }

        String guestToken = UUID.randomUUID().toString();
        LocalDateTime guestExpiry = LocalDateTime.now().plusDays(7);

        GameParticipant participant = GameParticipant.builder()
                .game(game)
                .user(null)
                .nickname(request.getNickname().trim())
                .isAnonymous(true)
                .guestToken(guestToken)
                .guestExpiresAt(guestExpiry)
                .status(ParticipantStatus.JOINED)
                .score(0)
                .correctCount(0)
                .build();

        participant = participantRepository.save(participant);
        log.info("Anonymous user joined game {}", game.getGameId());

        updatePlayerCount(game, 1);

        publishGameEvent(game.getGameId(), "PARTICIPANT_JOINED", null, Map.of(
                "participantId", participant.getParticipantId(),
                "nickname", participant.getNickname(),
                "isAnonymous", true,
                "playerCount", game.getPlayerCount()
        ));

        return gameMapper.toParticipantDTO(participant);
    }

    // ==================== GAME CONTROL ====================

    @Override
    public void startGame(UUID gameId, UUID hostId) {
        log.info("Starting game: {} by host: {}", gameId, hostId);

        Game game = getGameByIdWithCache(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.WAITING) {
            throw new GameException("Game cannot be started in current state: " + game.getGameStatus());
        }

        if (game.getPlayerCount() == 0) {
            throw new GameException("Cannot start game with no players");
        }

        game.setGameStatus(GameStatus.STARTING);
        gameRepository.save(game);
        cacheGame(game);

        publishGameEvent(gameId, "GAME_STARTING", hostId, Map.of(
                "countdown", 3,
                "totalQuestions", game.getTotalQuestions()
        ));

        taskScheduler.schedule(
                () -> actuallyStartGame(gameId, hostId),
                Instant.now().plusSeconds(3)
        );
    }

    @Transactional
    public void actuallyStartGame(UUID gameId, UUID hostId) {
        try {
            log.info("Actually starting game: {}", gameId);

            Game game = gameRepository.findById(gameId)
                    .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

            if (game.getGameStatus() != GameStatus.STARTING) {
                log.warn("Game {} status changed, abort start", gameId);
                return;
            }

            game.startGame();
            gameRepository.save(game);
            cacheGame(game);

            publishGameEvent(gameId, "GAME_STARTED", hostId, Map.of(
                    "totalQuestions", game.getTotalQuestions()
            ));

            moveToNextQuestion(gameId, hostId);

        } catch (Exception e) {
            log.error("Failed to start game {}: {}", gameId, e.getMessage(), e);
            try {
                Game game = gameRepository.findById(gameId).orElse(null);
                if (game != null && game.getGameStatus() == GameStatus.STARTING) {
                    game.setGameStatus(GameStatus.WAITING);
                    gameRepository.save(game);
                    cacheGame(game);
                    publishGameEvent(gameId, "GAME_START_FAILED", hostId, Map.of("error", e.getMessage()));
                }
            } catch (Exception ex) {
                log.error("Failed to rollback: {}", ex.getMessage());
            }
        }
    }

    @Override
    public void pauseGame(UUID gameId, UUID hostId) {
        log.info("Pausing game: {} by host: {}", gameId, hostId);

        Game game = getGameByIdWithCache(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Can only pause games in progress");
        }

        game.setGameStatus(GameStatus.PAUSED);
        gameRepository.save(game);
        cacheGame(game);

        publishGameEvent(gameId, "GAME_PAUSED", hostId, null);
    }

    @Override
    public void resumeGame(UUID gameId, UUID hostId) {
        log.info("Resuming game: {} by host: {}", gameId, hostId);

        Game game = getGameByIdWithCache(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.PAUSED) {
            throw new GameException("Can only resume paused games");
        }

        game.setGameStatus(GameStatus.IN_PROGRESS);
        gameRepository.save(game);
        cacheGame(game);

        publishGameEvent(gameId, "GAME_RESUMED", hostId, null);
    }

    @Override
    public void endGame(UUID gameId, UUID hostId) {
        log.info("Ending game: {} by host: {}", gameId, hostId);

        Game game = getGameByIdWithCache(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() == GameStatus.FINISHED || game.getGameStatus() == GameStatus.CANCELLED) {
            throw new GameException("Game already ended");
        }

        calculateFinalStatistics(game);

        game.endGame();
        gameRepository.save(game);
        cacheGame(game);

        quizService.incrementCompletionCount(game.getQuiz().getQuizId());
        quizService.updateAverageScore(game.getQuiz().getQuizId(), game.getAverageScore());

        List<LeaderboardEntryDTO> leaderboard = getFinalLeaderboard(gameId);

        publishGameEvent(gameId, "GAME_ENDED", hostId, Map.of(
                "leaderboard", leaderboard,
                "totalPlayers", game.getPlayerCount(),
                "averageScore", game.getAverageScore()
        ));

        log.info("Game {} ended with {} players", gameId, game.getPlayerCount());
    }

    @Override
    public void cancelGame(UUID gameId, UUID hostId) {
        log.info("Cancelling game: {} by host: {}", gameId, hostId);

        Game game = getGameByIdWithCache(gameId);
        validateHost(game, hostId);

        game.setGameStatus(GameStatus.CANCELLED);
        game.setEndedAt(LocalDateTime.now());
        gameRepository.save(game);
        cacheGame(game);

        publishGameEvent(gameId, "GAME_CANCELLED", hostId, Map.of("reason", "Cancelled by host"));
    }

    // ==================== QUESTION FLOW ====================

    @Override
    public QuestionResponseDTO moveToNextQuestion(UUID gameId, UUID hostId) {
        log.info("Moving to next question in game: {}", gameId);

        Game game = getGameByIdWithCache(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Game must be in progress");
        }

        if (game.getCurrentQuestionIndex() >= game.getTotalQuestions() - 1) {
            log.info("All questions answered, ending game {}", gameId);
            endGame(gameId, hostId);
            throw new GameException("No more questions");
        }

        List<Question> questions = getGameQuestions(game);

        game.moveToNextQuestion();
        Question currentQuestion = questions.get(game.getCurrentQuestionIndex());
        game.setCurrentQuestionId(currentQuestion.getQuestionId());
        gameRepository.save(game);
        cacheGame(game);

        log.info("Game {} moved to question {}/{}", gameId,
                game.getCurrentQuestionIndex() + 1, game.getTotalQuestions());

        broadcastQuestion(gameId);

        return gameMapper.toQuestionDTO(currentQuestion);
    }

    @Override
    public void broadcastQuestion(UUID gameId) {
        Game game = getGameByIdWithCache(gameId);
        Question question = questionRepository.findById(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        QuestionResponseDTO questionDTO = gameMapper.toQuestionDTOWithoutAnswers(question);

        publishGameEvent(gameId, "QUESTION_STARTED", null, Map.of(
                "question", questionDTO,
                "questionNumber", game.getCurrentQuestionIndex() + 1,
                "totalQuestions", game.getTotalQuestions(),
                "timeLimit", question.getTimeLimitSeconds()
        ));

        taskScheduler.schedule(
                () -> endQuestion(gameId),
                Instant.now().plusSeconds(question.getTimeLimitSeconds())
        );
    }

    @Override
    @Transactional
    public void endQuestion(UUID gameId) {
        log.info("Ending current question for game: {}", gameId);

        try {
            Game game = gameRepository.findById(gameId)
                    .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

            if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
                log.warn("Game {} not in progress, skip ending question", gameId);
                return;
            }

            // FIXED: Handle last question
            if (game.getCurrentQuestionIndex() >= game.getTotalQuestions() - 1) {
                log.info("Last question ended, auto-ending game {}", gameId);
                endGame(gameId, game.getHost().getUserId());
                return;
            }

            List<LeaderboardEntryDTO> leaderboard = getLeaderboard(gameId);

            Question currentQuestion = questionRepository.findById(game.getCurrentQuestionId())
                    .orElse(null);

            publishGameEvent(gameId, "QUESTION_ENDED", null, Map.of(
                    "leaderboard", leaderboard,
                    "questionNumber", game.getCurrentQuestionIndex() + 1,
                    "correctAnswer", currentQuestion != null ?
                            gameMapper.toQuestionDTO(currentQuestion) : null
            ));

            cacheLeaderboard(gameId, leaderboard);

        } catch (Exception e) {
            log.error("Failed to end question for game {}: {}", gameId, e.getMessage(), e);
        }
    }

    // ==================== ANSWER SUBMISSION ====================

    @Override
    public AnswerResultDTO submitAnswer(UUID gameId, UUID participantId, SubmitAnswerRequest request) {
        log.debug("Participant {} submitting answer for game {}", participantId, gameId);

        String lockKey = ANSWER_LOCK_PREFIX + participantId + ":" + gameId;
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(
                lockKey, "locked", 10, TimeUnit.SECONDS
        );

        if (Boolean.FALSE.equals(locked)) {
            throw new GameException("Answer submission in progress");
        }

        try {
            return doSubmitAnswer(gameId, participantId, request);
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    private AnswerResultDTO doSubmitAnswer(UUID gameId, UUID participantId, SubmitAnswerRequest request) {
        Game game = getGameByIdWithCache(gameId);

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Game is not in progress");
        }

        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        // FIXED: Validate participant access
        validateParticipantAccess(game, participant);

        Question question = questionRepository.findById(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        boolean alreadyAnswered = answerRepository.existsByGameAndParticipantAndQuestion(
                game, participant, question
        );
        if (alreadyAnswered) {
            throw new GameException("Already answered this question");
        }

        long responseTime = Duration.between(game.getQuestionStartTime(), LocalDateTime.now()).toMillis();
        boolean isTimeout = responseTime > (question.getTimeLimitSeconds() * 1000L);

        AnswerGradingResult grading = gradeAnswer(question, request.getSubmittedAnswer());

        int points = isTimeout ? 0 : calculatePoints(
                grading.correct(),
                question.getPoints(),
                responseTime,
                question.getTimeLimitSeconds()
        );

        UserAnswer answer = UserAnswer.builder()
                .game(game)
                .participant(participant)
                .question(question)
                .submittedAnswerJson(toJsonString(request.getSubmittedAnswer()))
                .submittedAnswerText(String.valueOf(request.getSubmittedAnswer()))
                .correct(grading.correct() && !isTimeout)
                .pointsEarned(points)
                .maxPoints(question.getPoints())
                .responseTimeMs(responseTime)
                .isSkipped(false)
                .isTimeout(isTimeout)
                .clientSubmittedAt(request.getSubmittedAt())
                .explanation(question.getExplanation())
                .build();

        answer = answerRepository.save(answer);

        // FIXED: Record participant stats properly
        recordParticipantStats(participant, answer);
        participant.updateScore(points);
        participantRepository.save(participant);

        invalidateLeaderboardCache(gameId);

        AnswerResultDTO result = AnswerResultDTO.builder()
                .correct(grading.correct() && !isTimeout)
                .pointsEarned(points)
                .responseTimeMs(responseTime)
                .currentScore(participant.getScore())
                .correctAnswer(grading.correctAnswer())
                .explanation(question.getExplanation())
                .build();

        log.debug("Answer processed: correct={}, points={}, timeout={}",
                grading.correct(), points, isTimeout);

        return result;
    }

    @Override
    public void skipQuestion(UUID gameId, UUID participantId) {
        log.debug("Participant {} skipping question in game {}", participantId, gameId);

        Game game = getGameByIdWithCache(gameId);
        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        validateParticipantAccess(game, participant);

        Question question = questionRepository.findById(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        boolean alreadyAnswered = answerRepository.existsByGameAndParticipantAndQuestion(
                game, participant, question
        );
        if (alreadyAnswered) {
            throw new GameException("Already answered this question");
        }

        UserAnswer answer = UserAnswer.builder()
                .game(game)
                .participant(participant)
                .question(question)
                .submittedAnswerJson("{}")
                .submittedAnswerText("SKIPPED")
                .correct(false)
                .pointsEarned(0)
                .maxPoints(question.getPoints())
                .isSkipped(true)
                .build();

        answerRepository.save(answer);

        participant.recordSkip();
        participantRepository.save(participant);

        log.debug("Question skipped by participant {}", participantId);
    }

    // ==================== PARTICIPANT MANAGEMENT ====================

    @Override
    public void kickParticipant(UUID gameId, UUID participantId, UUID hostId, String reason) {
        log.info("Kicking participant {} from game {}", participantId, gameId);

        Game game = getGameByIdWithCache(gameId);
        validateHost(game, hostId);

        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        validateParticipantAccess(game, participant);

        // FIXED: Update active player count
        boolean wasActive = participant.isActive();

        participant.kick(reason);
        participantRepository.save(participant);

        updatePlayerCount(game, -1);

        if (wasActive && game.getGameStatus() == GameStatus.IN_PROGRESS) {
            game.setActivePlayerCount(Math.max(0, game.getActivePlayerCount() - 1));
            gameRepository.save(game);
            cacheGame(game);
        }

        checkAndAutoEndGameIfNeeded(game);

        publishGameEvent(gameId, "PARTICIPANT_KICKED", hostId, Map.of(
                "participantId", participantId,
                "nickname", participant.getNickname(),
                "reason", reason,
                "playerCount", game.getPlayerCount()
        ));
    }

    @Override
    public void leaveGame(UUID gameId, UUID participantId) {
        log.info("Participant {} leaving game {}", participantId, gameId);

        Game game = getGameByIdWithCache(gameId);
        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        validateParticipantAccess(game, participant);

        // FIXED: Update active player count
        boolean wasActive = participant.isActive();

        participant.leave();
        participantRepository.save(participant);

        updatePlayerCount(game, -1);

        if (wasActive && game.getGameStatus() == GameStatus.IN_PROGRESS) {
            game.setActivePlayerCount(Math.max(0, game.getActivePlayerCount() - 1));
            gameRepository.save(game);
            cacheGame(game);
        }

        checkAndAutoEndGameIfNeeded(game);

        publishGameEvent(gameId, "PARTICIPANT_LEFT",
                participant.getUser() != null ? participant.getUser().getUserId() : null,
                Map.of(
                        "participantId", participantId,
                        "nickname", participant.getNickname(),
                        "playerCount", game.getPlayerCount()
                )
        );
    }

    @Override
    public List<GameParticipantDTO> getParticipants(UUID gameId) {
        String cacheKey = PARTICIPANTS_CACHE_PREFIX + gameId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);

        if (cached != null) {
            try {
                String json = (String) cached;
                return redisObjectMapper.readValue(json,
                        redisObjectMapper.getTypeFactory().constructCollectionType(List.class, GameParticipantDTO.class));
            } catch (Exception e) {
                log.warn("Failed to deserialize cached participants: {}", e.getMessage());
            }
        }

        Game game = getGameByIdWithCache(gameId);
        List<GameParticipant> participants = participantRepository.findByGameAndStatusIn(
                game,
                List.of(ParticipantStatus.JOINED, ParticipantStatus.READY, ParticipantStatus.PLAYING)
        );

        List<GameParticipantDTO> result = participants.stream()
                .map(gameMapper::toParticipantDTO)
                .collect(Collectors.toList());

        try {
            String json = redisObjectMapper.writeValueAsString(result);
            redisTemplate.opsForValue().set(cacheKey, json, PARTICIPANTS_TTL_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Failed to cache participants: {}", e.getMessage());
        }

        return result;
    }

    // ==================== LEADERBOARD ====================

    @Override
    public List<LeaderboardEntryDTO> getLeaderboard(UUID gameId) {
        String cacheKey = LEADERBOARD_CACHE_PREFIX + gameId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);

        if (cached != null) {
            try {
                String json = (String) cached;
                return redisObjectMapper.readValue(json,
                        redisObjectMapper.getTypeFactory().constructCollectionType(List.class, LeaderboardEntryDTO.class));
            } catch (Exception e) {
                log.warn("Failed to deserialize cached leaderboard: {}", e.getMessage());
            }
        }

        Game game = getGameByIdWithCache(gameId);
        List<GameParticipant> participants = participantRepository.findByGameOrderByScoreDescTotalTimeMsAsc(game);

        List<LeaderboardEntryDTO> leaderboard = new ArrayList<>();
        int rank = 1;
        for (GameParticipant p : participants) {
            leaderboard.add(LeaderboardEntryDTO.builder()
                    .rank(rank++)
                    .participantId(p.getParticipantId())
                    .nickname(p.getNickname())
                    .score(p.getScore())
                    .correctCount(p.getCorrectCount())
                    .currentStreak(p.getCurrentStreak())
                    .averageTimeMs(p.getAverageResponseTimeMs())
                    .isAnonymous(p.isAnonymous())
                    .build());
        }

        cacheLeaderboard(gameId, leaderboard);

        return leaderboard;
    }

    @Override
    public List<LeaderboardEntryDTO> getFinalLeaderboard(UUID gameId) {
        List<LeaderboardEntryDTO> leaderboard = getLeaderboard(gameId);

        Game game = getGameByIdWithCache(gameId);
        List<GameParticipant> participants = participantRepository.findByGameOrderByScoreDescTotalTimeMsAsc(game);

        int rank = 1;
        for (GameParticipant p : participants) {
            p.setFinalRank(rank++);
            p.complete();
        }
        participantRepository.saveAll(participants);

        return leaderboard;
    }

    // ==================== GAME INFO ====================

    @Override
    public GameResponseDTO getGameByPin(String pinCode) {
        Game game = getGameByPinWithValidation(pinCode);
        return gameMapper.toResponseDTO(game);
    }

    @Override
    public Game findGameEntityById(UUID gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
    }

    @Override
    public GameResponseDTO getGameById(UUID gameId) {
        Game game = getGameByIdWithCache(gameId);
        return gameMapper.toResponseDTO(game);
    }

    @Override
    @Cacheable(value = "gameDetails", key = "#gameId + '-' + (#userId != null ? #userId : 'null')")
    public GameDetailDTO getGameDetails(UUID gameId, UUID userId) {
        Game game = getGameByIdWithCache(gameId);

        boolean isHost = game.getHost().getUserId().equals(userId);
        GameParticipant participant = null;

        if (!isHost && userId != null) {
            participant = participantRepository.findByGameAndUser_UserId(game, userId)
                    .orElse(null);
        }

        return gameMapper.toDetailDTO(game, isHost, participant);
    }

    @Override
    public Page<GameResponseDTO> getMyGames(UUID userId, Pageable pageable) {
        return gameRepository.findByHostUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(gameMapper::toResponseDTO);
    }

    // ==================== STATISTICS ====================

    @Override
    public GameStatisticsDTO getGameStatistics(UUID gameId) {
        Game game = getGameByIdWithCache(gameId);
        List<GameParticipant> participants = participantRepository.findByGame(game);

        int totalAnswers = answerRepository.countByGame(game);
        int correctAnswers = answerRepository.countByGameAndCorrectTrue(game);

        return GameStatisticsDTO.builder()
                .gameId(gameId)
                .totalPlayers(game.getPlayerCount())
                .completedPlayers(game.getCompletedPlayerCount())
                .totalQuestions(game.getTotalQuestions())
                .totalAnswers(totalAnswers)
                .correctAnswers(correctAnswers)
                .averageScore(game.getAverageScore())
                .averageAccuracy(totalAnswers > 0 ? (correctAnswers * 100.0 / totalAnswers) : 0)
                .build();
    }

    @Override
    public UserQuizStatsDTO getUserStatistics(UUID userId, UUID quizId) {
        UserQuizStatistics stats = statsRepository.findByUserUserIdAndQuizQuizId(userId, quizId)
                .orElse(createDefaultStats(userId, quizId));

        return gameMapper.toStatsDTO(stats);
    }

    // ==================== CACHE OPERATIONS ====================

    private Game getGameByPinWithValidation(String pinCode) {
        String cacheKey = GAME_PIN_PREFIX + pinCode;
        Object cached = redisTemplate.opsForValue().get(cacheKey);

        if (cached != null) {
            try {
                String json = (String) cached;
                return redisObjectMapper.readValue(json, Game.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize cached game: {}", e.getMessage());
            }
        }

        Game game = gameRepository.findByPinCode(pinCode)
                .orElseThrow(() -> new GameException("Game not found with PIN: " + pinCode));

        cacheGame(game);
        return game;
    }

    // ADDED: Cache game by ID
    private Game getGameByIdWithCache(UUID gameId) {
        String cacheKey = GAME_CACHE_PREFIX + gameId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);

        if (cached != null) {
            try {
                String json = (String) cached;
                return redisObjectMapper.readValue(json, Game.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize cached game: {}", e.getMessage());
            }
        }

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        cacheGame(game);
        return game;
    }

    private void cacheGame(Game game) {
        try {
            String json = redisObjectMapper.writeValueAsString(game);

            String idKey = GAME_CACHE_PREFIX + game.getGameId();
            String pinKey = GAME_PIN_PREFIX + game.getPinCode();

            redisTemplate.opsForValue().set(idKey, json, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(pinKey, json, CACHE_TTL_SECONDS, TimeUnit.SECONDS);

            log.debug("Cached game {} with TTL {}s", game.getGameId(), CACHE_TTL_SECONDS);
        } catch (JsonProcessingException e) {
            log.error("Failed to cache game {}: {}", game.getGameId(), e.getMessage());
        }
    }

    private void cacheLeaderboard(UUID gameId, List<LeaderboardEntryDTO> leaderboard) {
        try {
            String json = redisObjectMapper.writeValueAsString(leaderboard);
            String cacheKey = LEADERBOARD_CACHE_PREFIX + gameId;
            redisTemplate.opsForValue().set(cacheKey, json, LEADERBOARD_TTL_SECONDS, TimeUnit.SECONDS);
        } catch (JsonProcessingException e) {
            log.error("Failed to cache leaderboard: {}", e.getMessage());
        }
    }

    private void invalidateLeaderboardCache(UUID gameId) {
        String cacheKey = LEADERBOARD_CACHE_PREFIX + gameId;
        redisTemplate.delete(cacheKey);
    }

    private void invalidateParticipantsCache(UUID gameId) {
        String cacheKey = PARTICIPANTS_CACHE_PREFIX + gameId;
        redisTemplate.delete(cacheKey);
    }

    // ==================== KAFKA EVENTS ====================

    private void publishGameEvent(UUID gameId, String eventType, UUID userId, Map<String, Object> data) {
        GameEvent event = GameEvent.builder()
                .gameId(gameId)
                .eventType(eventType)
                .userId(userId)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();

        try {
            kafkaTemplate.send(KAFKA_TOPIC, gameId.toString(), event);
            log.debug("Published event: {} for game: {}", eventType, gameId);
        } catch (Exception e) {
            log.error("Failed to publish game event: {} for game: {}", eventType, gameId, e);
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * ADDED: Validate participant has access to this game
     * Checks if participant is kicked, left, or belongs to game
     */
    private void validateParticipantAccess(Game game, GameParticipant participant) {
        if (!participant.getGame().getGameId().equals(game.getGameId())) {
            throw new GameException("Participant does not belong to this game");
        }
        if (participant.isKicked()) {
            throw new GameException("You have been kicked from this game");
        }
        if (participant.getStatus() == ParticipantStatus.LEFT) {
            throw new GameException("You have left this game");
        }
    }

    /**
     * ADDED: Record participant statistics after answering
     * Updates score, correctCount, streak tracking, etc.
     */
    private void recordParticipantStats(GameParticipant participant, UserAnswer answer) {
        if (answer.isCorrect() && !answer.isTimeout() && !answer.isSkipped()) {
            participant.recordCorrectAnswer(answer.getResponseTimeMs());
        } else if (!answer.isSkipped()) {
            participant.recordIncorrectAnswer(answer.getResponseTimeMs());
        } else {
            participant.recordSkip();
        }
    }

    /**
     * ADDED: Auto-end game if all players have left/kicked
     */
    private void checkAndAutoEndGameIfNeeded(Game game) {
        if (game.getGameStatus() == GameStatus.IN_PROGRESS) {
            if (game.getActivePlayerCount() <= 0) {
                log.warn("No more active players in game {}, auto-ending", game.getGameId());
                game.setGameStatus(GameStatus.FINISHED);
                game.setEndedAt(LocalDateTime.now());
                gameRepository.save(game);
                cacheGame(game);

                publishGameEvent(game.getGameId(), "GAME_AUTO_ENDED", game.getHost().getUserId(),
                        Map.of("reason", "No active players remaining"));
            }
        }
    }

    private String generateUniquePinCode() {
        String pin;
        int attempts = 0;
        Random random = new Random();

        do {
            pin = String.format("%06d", random.nextInt(1000000));
            attempts++;

            if (attempts > 10) {
                throw new GameException("Unable to generate unique PIN code");
            }
        } while (gameRepository.existsByPinCode(pin));

        return pin;
    }

    private void validateGameJoinable(Game game) {
        if (game.getGameStatus() != GameStatus.WAITING) {
            throw new GameException("Game already started or ended");
        }
        if (!game.canJoin()) {
            throw new GameException("Game is full");
        }
    }

    private void validateHost(Game game, UUID hostId) {
        if (!game.getHost().getUserId().equals(hostId)) {
            throw new GameException("Only game host can perform this action");
        }
    }

    private void updatePlayerCount(Game game, int delta) {
        game.setPlayerCount(game.getPlayerCount() + delta);
        game.setActivePlayerCount(Math.max(0, game.getActivePlayerCount() + delta));
        gameRepository.save(game);
        cacheGame(game);
        invalidateParticipantsCache(game.getGameId());
    }

    private List<Question> getGameQuestions(Game game) {
        List<Question> questions = questionRepository
                .findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(game.getQuiz().getQuizId());

        if (game.isRandomizeQuestions()) {
            Collections.shuffle(questions);
        }

        return questions;
    }

    // ==================== GRADING LOGIC ====================

    private AnswerGradingResult gradeAnswer(Question question, Object submittedAnswer) {
        try {
            return switch (question.getType()) {
                case SINGLE_CHOICE -> gradeSingleChoice(question, submittedAnswer);
                case MULTIPLE_CHOICE -> gradeMultipleChoice(question, submittedAnswer);
                case TRUE_FALSE -> gradeTrueFalse(question, submittedAnswer);
                case FILL_IN_THE_BLANK -> gradeFillInBlank(question, submittedAnswer);
                default -> new AnswerGradingResult(false, "Unsupported question type");
            };
        } catch (Exception e) {
            log.error("Grading error for question {}: {}", question.getQuestionId(), e.getMessage(), e);
            return new AnswerGradingResult(false, "Grading failed");
        }
    }

    private AnswerGradingResult gradeSingleChoice(Question question, Object answer) {
        UUID selectedId;

        if (answer instanceof String) {
            selectedId = UUID.fromString((String) answer);
        } else if (answer instanceof UUID) {
            selectedId = (UUID) answer;
        } else {
            throw new IllegalArgumentException("Invalid answer type: " + answer.getClass());
        }

        List<UUID> correctIds = question.getOptions().stream()
                .filter(opt -> opt.isCorrect())
                .map(opt -> opt.getOptionId())
                .toList();

        boolean isCorrect = correctIds.contains(selectedId);
        return new AnswerGradingResult(isCorrect, correctIds.toString());
    }

    private AnswerGradingResult gradeMultipleChoice(Question question, Object answer) {
        List<UUID> selectedIds;

        if (answer instanceof List<?>) {
            selectedIds = ((List<?>) answer).stream()
                    .map(id -> id instanceof String ? UUID.fromString((String) id) : (UUID) id)
                    .toList();
        } else {
            throw new IllegalArgumentException("Invalid answer type for multiple choice");
        }

        List<UUID> correctIds = question.getOptions().stream()
                .filter(opt -> opt.isCorrect())
                .map(opt -> opt.getOptionId())
                .toList();

        boolean isCorrect = new HashSet<>(selectedIds).equals(new HashSet<>(correctIds));
        return new AnswerGradingResult(isCorrect, correctIds.toString());
    }

    private AnswerGradingResult gradeTrueFalse(Question question, Object answer) {
        boolean submitted;

        if (answer instanceof Boolean) {
            submitted = (Boolean) answer;
        } else if (answer instanceof String) {
            submitted = Boolean.parseBoolean((String) answer);
        } else {
            throw new IllegalArgumentException("Invalid answer type for true/false");
        }

        boolean correct = question.getOptions().get(0).isCorrect();
        boolean isCorrect = submitted == correct;

        return new AnswerGradingResult(isCorrect, String.valueOf(correct));
    }

    private AnswerGradingResult gradeFillInBlank(Question question, Object answer) {
        String submitted = ((String) answer).trim().toLowerCase();
        String correct = question.getOptions().get(0).getText().trim().toLowerCase();

        boolean isCorrect = submitted.equals(correct);
        return new AnswerGradingResult(isCorrect, correct);
    }

    private int calculatePoints(boolean isCorrect, int basePoints, long responseTimeMs, int timeLimitSeconds) {
        if (!isCorrect) {
            return 0;
        }

        int points = basePoints;
        long timeLimitMs = timeLimitSeconds * 1000L;

        if (responseTimeMs < timeLimitMs * 0.25) {
            points = (int) (points * 1.2);
        } else if (responseTimeMs < timeLimitMs * 0.5) {
            points = (int) (points * 1.1);
        }

        return points;
    }

    // ==================== STATISTICS ====================

    private void calculateFinalStatistics(Game game) {
        List<GameParticipant> participants = participantRepository.findByGame(game);

        if (participants.isEmpty()) {
            game.setAverageScore(0.0);
            game.setCompletedPlayerCount(0);
            return;
        }

        double avgScore = participants.stream()
                .mapToInt(GameParticipant::getScore)
                .average()
                .orElse(0.0);

        game.setAverageScore(avgScore);
        game.setCompletedPlayerCount((int) participants.stream()
                .filter(p -> p.getStatus() == ParticipantStatus.COMPLETED)
                .count());

        for (GameParticipant participant : participants) {
            if (participant.getUser() != null) {
                updateUserStatistics(participant);
            }
        }
    }

    private void updateUserStatistics(GameParticipant participant) {
        UUID userId = participant.getUser().getUserId();
        UUID quizId = participant.getGame().getQuiz().getQuizId();

        UserQuizStatistics stats = statsRepository.findByUserUserIdAndQuizQuizId(userId, quizId)
                .orElse(createDefaultStats(userId, quizId));

        stats.recordGamePlayed();
        if (participant.getStatus() == ParticipantStatus.COMPLETED) {
            stats.recordGameCompleted();
        }

        stats.setTotalPoints(stats.getTotalPoints() + participant.getScore());
        stats.setTotalCorrectAnswers(stats.getTotalCorrectAnswers() + participant.getCorrectCount());
        stats.setTotalTimeSpentMs(stats.getTotalTimeSpentMs() + participant.getTotalTimeMs());

        if (participant.getScore() > stats.getHighestScore()) {
            stats.setHighestScore(participant.getScore());
        }

        if (participant.getFinalRank() != null) {
            if (stats.getBestRank() == null || participant.getFinalRank() < stats.getBestRank()) {
                stats.setBestRank(participant.getFinalRank());
            }
        }

        stats.updateAccuracy();
        stats.updateAverageScore();

        statsRepository.save(stats);
    }

    private UserQuizStatistics createDefaultStats(UUID userId, UUID quizId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GameException("User not found"));
        Quiz quiz = quizId != null ? quizRepository.findById(quizId).orElse(null) : null;

        return UserQuizStatistics.builder()
                .user(user)
                .quiz(quiz)
                .build();
    }

    private String toJsonString(Object obj) {
        try {
            return redisObjectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Error converting to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    // ==================== INNER CLASS ====================

    private record AnswerGradingResult(boolean correct, String correctAnswer) {}
}