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
import com.kkunquizapp.QuizAppBackend.game.service.GameScheduler;
import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.quiz.service.QuizService;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
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

    private static final String GAME_PIN_PREFIX = "game:pin:";
    private static final String LEADERBOARD_CACHE_PREFIX = "leaderboard:";
    private static final String PARTICIPANTS_CACHE_PREFIX = "participants:";
    private static final String ANSWER_LOCK_PREFIX = "answer:lock:";

    private static final long PIN_CACHE_TTL_SECONDS = 300;
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

        game.setPlayerCount(0);
        game.setActivePlayerCount(0);
        gameRepository.save(game);

        // Cache PIN -> GameId mapping only
        cachePinLookup(pinCode, game.getGameId());

        publishGameEvent(game.getGameId(), "GAME_CREATED", hostId, Map.of(
                "pinCode", pinCode,
                "quizTitle", quiz.getTitle(),
                "totalQuestions", questions.size()
        ));

        quizService.incrementPlayCount(quiz.getQuizId());

        // ✅ FIX: Return DTO with populated data
        GameResponseDTO response = gameMapper.toResponseDTO(game);
        response.setHostParticipantId(hostId.toString());
        log.info("Game created successfully: gameId={}, pinCode={}, hostId={}",
                game.getGameId(), pinCode,hostId);

        return response;
    }
    // ==================== JOIN GAME ====================

    @Override
    public GameParticipantDTO joinGame(String pinCode, JoinGameRequest request, UUID userId) {
        log.info("User {} joining game with PIN: {}", userId, pinCode);

        Game game = getGameByPinWithValidation(pinCode);
        validateGameJoinable(game, userId);

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
        validateGameJoinable(game, null);

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

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.WAITING) {
            throw new GameException("Game cannot be started in current state: " + game.getGameStatus());
        }

        if (game.getPlayerCount() == 0) {
            throw new GameException("Cannot start game with no players");
        }

        // Eager load questions
        List<Question> questions = getGameQuestionsEager(game);
        if (questions.isEmpty()) {
            throw new GameException("Quiz has no questions");
        }
        for (Question q : questions) {
            Hibernate.initialize(q.getOptions());
        }

        // ✅ Set game status to IN_PROGRESS
        game.startGame();
        gameRepository.saveAndFlush(game);

        log.info("Game {} status changed to IN_PROGRESS and flushed to DB", gameId);

        // ✅ FIX 1: ASYNC broadcast with 500ms delay
        // Cho frontend có thời gian subscribe trước khi broadcast Q1
        log.info("🚀 Scheduling first question broadcast in 500ms for game {}", gameId);

        taskScheduler.schedule(
                () -> {
                    try {
                        log.info("📤 [ASYNC] Broadcasting first question for game {}", gameId);
                        moveToNextQuestion(gameId, hostId);
                    } catch (Exception e) {
                        log.error("❌ Failed to move to first question: {}", e.getMessage(), e);
                        publishGameEvent(gameId, "GAME_START_FAILED", hostId, Map.of(
                                "error", e.getMessage()
                        ));
                    }
                },
                Instant.now().plusMillis(500)  // ← 500ms delay để frontend subscribe
        );

        // ✅ API return immediately, không block
        publishGameEvent(gameId, "GAME_STARTED", hostId, Map.of(
                "totalQuestions", game.getTotalQuestions()
        ));
    }

    /**
     * ✅ NEW: Broadcast first question directly
     * Không cần gọi moveToNextQuestion() lại
     */
    private void broadcastFirstQuestion(UUID gameId, List<Question> questions) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        if (questions.isEmpty()) {
            throw new GameException("No questions available");
        }

        // ✅ Set to first question
        game.setCurrentQuestionIndex(0);
        Question firstQuestion = questions.get(0);
        game.setCurrentQuestionId(firstQuestion.getQuestionId());
        game.setQuestionStartTime(LocalDateTime.now());
        gameRepository.save(game);

        log.info("🎯 Broadcasting first question {} for game {}",
                firstQuestion.getQuestionId(), gameId);

        // ✅ Broadcast immediately
        publishGameEvent(gameId, "QUESTION_STARTED", game.getHost().getUserId(), Map.of(
                "question", gameMapper.toQuestionDTOWithoutAnswers(firstQuestion),
                "questionNumber", 1,
                "totalQuestions", game.getTotalQuestions(),
                "timeLimit", firstQuestion.getTimeLimitSeconds(),
                "catchUp", true
        ));
    }

//    @Transactional
//    public void actuallyStartGame(UUID gameId, UUID hostId) {
//        try {
//            log.info("Actually starting game: {}", gameId);
//
//            Game game = gameRepository.findById(gameId)
//                    .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
//
//            if (game.getGameStatus() != GameStatus.STARTING) {
//                log.warn("Game {} status changed, abort start", gameId);
//                return;
//            }
//
//            game.startGame();
//            gameRepository.save(game);
//
//            publishGameEvent(gameId, "GAME_STARTED", hostId, Map.of(
//                    "totalQuestions", game.getTotalQuestions()
//            ));
//
//            taskScheduler.schedule(
//                    () -> moveToNextQuestion(gameId, hostId),
//                    Instant.now().plusSeconds(5)
//            );
//
//        } catch (Exception e) {
//            log.error("Failed to start game {}: {}", gameId, e.getMessage(), e);
//            try {
//                Game game = gameRepository.findById(gameId).orElse(null);
//                if (game != null && game.getGameStatus() == GameStatus.STARTING) {
//                    game.setGameStatus(GameStatus.WAITING);
//                    gameRepository.save(game);
//                    publishGameEvent(gameId, "GAME_START_FAILED", hostId, Map.of("error", e.getMessage()));
//                }
//            } catch (Exception ex) {
//                log.error("Failed to rollback: {}", ex.getMessage());
//            }
//        }
//    }

    @Override
    public void pauseGame(UUID gameId, UUID hostId) {
        log.info("Pausing game: {} by host: {}", gameId, hostId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Can only pause games in progress");
        }

        game.setGameStatus(GameStatus.PAUSED);
        gameRepository.save(game);

        publishGameEvent(gameId, "GAME_PAUSED", hostId, null);
    }

    @Override
    public void resumeGame(UUID gameId, UUID hostId) {
        log.info("Resuming game: {} by host: {}", gameId, hostId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.PAUSED) {
            throw new GameException("Can only resume paused games");
        }

        game.setGameStatus(GameStatus.IN_PROGRESS);
        gameRepository.save(game);

        publishGameEvent(gameId, "GAME_RESUMED", hostId, null);
    }

    @Override
    @Transactional // Đảm bảo có session
    public void endGame(UUID gameId, UUID hostId) {
        log.info("Ending game: {} by host: {}", gameId, hostId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
        validateHost(game, hostId);

        if (game.getGameStatus() == GameStatus.FINISHED || game.getGameStatus() == GameStatus.CANCELLED) {
            throw new GameException("Game already ended");
        }

        // ✅ FIX: Reload game với quiz để tránh lazy exception
        game = gameRepository.findByIdWithQuiz(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        calculateFinalStatistics(game);

        game.endGame();
        gameRepository.save(game);

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

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
        validateHost(game, hostId);

        game.setGameStatus(GameStatus.CANCELLED);
        game.setEndedAt(LocalDateTime.now());
        gameRepository.save(game);

        publishGameEvent(gameId, "GAME_CANCELLED", hostId, Map.of("reason", "Cancelled by host"));
    }

    // ==================== QUESTION FLOW ====================

    @Override
    @Transactional
    public QuestionResponseDTO moveToNextQuestion(UUID gameId, UUID hostId) {
        log.info("Host {} moving to next question in game: {}", hostId, gameId);

        // 1. Lấy game + validate
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Game must be in progress to move to next question");
        }

        // 2. Kiểm tra còn câu hỏi không
        if (game.getCurrentQuestionIndex() >= game.getTotalQuestions() - 1) {
            log.info("No more questions → auto ending game {}", gameId);
            endGame(gameId, hostId);
            throw new GameException("No more questions. Game has ended.");
        }

        // 3. ✅ FIX: Lấy danh sách câu hỏi một lần duy nhất (JOIN FETCH options)
        List<Question> questions = getGameQuestionsEager(game);

        if (questions.isEmpty()) {
            throw new GameException("Quiz has no questions");
        }

        // 4. Di chuyển sang câu tiếp theo
        game.moveToNextQuestion(); // tăng currentQuestionIndex

        Question currentQuestion = questions.get(game.getCurrentQuestionIndex());

        // 5. Cập nhật DB
        game.setCurrentQuestionId(currentQuestion.getQuestionId());
        game.setQuestionStartTime(LocalDateTime.now());
        gameRepository.save(game);

        log.info("Game {} → question {}/{} (ID: {})",
                gameId,
                game.getCurrentQuestionIndex() + 1,
                game.getTotalQuestions(),
                currentQuestion.getQuestionId());

        // 6. ✅ FIX: Gửi câu hỏi ngay tại đây (TRANSACTION VẪN MỞ, OPTIONS ĐÃ LOAD)
        broadcastQuestionFromGameSession(gameId, currentQuestion);

        // 7. Trả về DTO cho host
        return gameMapper.toQuestionDTOWithoutAnswers(currentQuestion);
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentQuestionResponseDTO getCurrentQuestion(UUID gameId) {
        log.debug("Fetching current question for game {}", gameId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        // Chỉ trả về nếu game đang IN_PROGRESS và có câu hỏi hiện tại
        if (game.getGameStatus() != GameStatus.IN_PROGRESS ||
                game.getCurrentQuestionIndex() < 0 ||
                game.getCurrentQuestionId() == null) {

            return CurrentQuestionResponseDTO.builder()
                    .hasCurrentQuestion(false)
                    .build();
        }

        // Lấy câu hỏi với options đã load
        Question currentQuestion = questionRepository.findByIdWithOptions(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        // Tính thời gian còn lại
        LocalDateTime startTime = game.getQuestionStartTime();
        LocalDateTime now = LocalDateTime.now();
        long elapsedSeconds = Duration.between(startTime, now).getSeconds();
        long remaining = Math.max(0, currentQuestion.getTimeLimitSeconds() - elapsedSeconds);

        QuestionResponseDTO questionDTO = gameMapper.toQuestionDTOWithoutAnswers(currentQuestion);

        return CurrentQuestionResponseDTO.builder()
                .question(questionDTO)
                .questionNumber(game.getCurrentQuestionIndex() + 1)
                .totalQuestions(game.getTotalQuestions())
                .timeLimitSeconds(currentQuestion.getTimeLimitSeconds())
                .remainingTimeSeconds(remaining)
                .hasCurrentQuestion(true)
                .build();
    }
    /**
     * Broadcast câu hỏi hiện tại cho tất cả người chơi
     * ✅ FIX: Gửi từ danh sách questions đã fetch sẵn (TRONG TRANSACTION)
     *
     * Gọi NGAY SAU moveToNextQuestion() để đảm bảo options đã loaded
     */
    @Override
    @Transactional
    public void broadcastQuestionFromGameSession(UUID gameId, Question currentQuestion) {
        log.info("🎯 Broadcasting question {} for game {}", currentQuestion.getQuestionId(), gameId);

        if (currentQuestion.getOptions() == null || currentQuestion.getOptions().isEmpty()) {
            log.warn("Question {} has no options loaded", currentQuestion.getQuestionId());
            List<Option> options = currentQuestion.getOptions();
            if (options != null) {
                Hibernate.initialize(options);
            }
        }

        QuestionResponseDTO questionDTO = gameMapper.toQuestionDTOWithoutAnswers(currentQuestion);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        publishGameEvent(gameId, "QUESTION_STARTED", null, Map.of(
                "question", questionDTO,
                "questionNumber", game.getCurrentQuestionIndex() + 1,
                "totalQuestions", game.getTotalQuestions(),
                "timeLimit", currentQuestion.getTimeLimitSeconds(),
                "catchUp", true
        ));

        log.info("✅ Question {} broadcasted successfully for game {}",
                currentQuestion.getQuestionId(), gameId);

        // ✅ FIX 2: Schedule ONLY here (not in startGame or anywhere else)
        log.info("⏱️ Scheduling end question in {} seconds", currentQuestion.getTimeLimitSeconds() + 1);

        taskScheduler.schedule(
                () -> endQuestion(gameId),
                Instant.now().plusSeconds(currentQuestion.getTimeLimitSeconds() + 1)
        );
    }

    @Override
    @Transactional
    public void endQuestion(UUID gameId) {
        log.info("Ending current question for game: {}", gameId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            log.info("Game {} already ended or paused → skip endQuestion", gameId);
            return;
        }

        // Lấy câu hỏi hiện tại với options (để lấy đáp án đúng + explanation)
        Question currentQuestion = questionRepository.findByIdWithOptions(game.getCurrentQuestionId())
                .orElse(null);

        // Lấy leaderboard realtime
        List<LeaderboardEntryDTO> leaderboard = getLeaderboard(gameId);

        // ✅ Tạo payload đầy đủ gửi cho frontend
        Map<String, Object> data = new HashMap<>();
        data.put("leaderboard", leaderboard);
        data.put("questionNumber", game.getCurrentQuestionIndex() + 1);

        if (currentQuestion != null) {
            // Gửi câu hỏi đầy đủ có đáp án đúng + explanation
            data.put("revealedQuestion", gameMapper.toQuestionDTO(currentQuestion)); // có correct = true
            data.put("explanation", currentQuestion.getExplanation());
        }

        data.put("nextQuestionInSeconds", 8); // thời gian chờ trước câu tiếp theo

        // ✅ Gửi event QUESTION_ENDED với đầy đủ thông tin
        publishGameEvent(gameId, "QUESTION_ENDED", null, data);

        cacheLeaderboard(gameId, leaderboard);

        // Tự động chuyển câu tiếp theo hoặc kết thúc game
        if (game.getCurrentQuestionIndex() < game.getTotalQuestions() - 1) {
            taskScheduler.schedule(
                    () -> moveToNextQuestion(gameId, game.getHost().getUserId()),
                    Instant.now().plusSeconds(8)
            );
        } else {
            taskScheduler.schedule(
                    () -> endGame(gameId, game.getHost().getUserId()),
                    Instant.now().plusSeconds(11)
            );
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
        // 1️⃣ Fetch Game
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Game is not in progress");
        }

        // 2️⃣ Fetch Participant
        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        validateParticipantAccess(game, participant);

        // ✅ 3️⃣ FIX: Get currentQuestionId from GAME (not from request)
        UUID currentQuestionId = game.getCurrentQuestionId();
        if (currentQuestionId == null) {
            throw new GameException("No current question in progress");
        }

        // 4️⃣ Fetch Question with Options (eager load)
        Question question = questionRepository.findByIdWithOptions(currentQuestionId)
                .orElseThrow(() -> new GameException("Current question not found: " + currentQuestionId));

        log.info("Question loaded: {} (type: {}, options: {})",
                question.getQuestionId(),
                question.getType(),
                question.getOptions().size());

        // 5️⃣ Check if already answered
        boolean alreadyAnswered = answerRepository.existsByGameAndParticipantAndQuestion(
                game, participant, question
        );
        if (alreadyAnswered) {
            throw new GameException("Already answered this question");
        }

        // 6️⃣ Calculate response time
        long responseTime = Duration.between(game.getQuestionStartTime(), LocalDateTime.now()).toMillis();
        boolean isTimeout = responseTime > (question.getTimeLimitSeconds() * 1000L);

        log.info("Response time: {}ms, timeout: {}, limit: {}s",
                responseTime, isTimeout, question.getTimeLimitSeconds());

        // ✅ 7️⃣ Grade answer using the loaded question with options
        AnswerGradingResult grading = gradeAnswer(question, request.getSubmittedAnswer());

        log.info("Grading result: correct={}, answer={}", grading.correct(), grading.correctAnswer());

        // 8️⃣ Calculate points
        int points = isTimeout ? 0 : calculatePoints(
                grading.correct(),
                question.getPoints(),
                responseTime,
                question.getTimeLimitSeconds()
        );

        // 9️⃣ Save answer
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
        log.info("Answer saved: id={}, correct={}, points={}", answer.getAnswerId(), answer.isCorrect(), points);

        // 🔟 Update participant stats
        recordParticipantStats(participant, answer);
        participant.updateScore(points);
        participantRepository.save(participant);

        // 1️⃣1️⃣ Invalidate leaderboard cache
        invalidateLeaderboardCache(gameId);

        // 1️⃣2️⃣ Build response DTO
        AnswerResultDTO result = AnswerResultDTO.builder()
                .correct(grading.correct() && !isTimeout)
                .pointsEarned(points)
                .responseTimeMs(responseTime)
                .currentScore(participant.getScore())
                .correctAnswer(grading.correctAnswer())
                .explanation(question.getExplanation())
                .build();

        log.info("Answer result: correct={}, points={}, score={}",
                result.isCorrect(), result.getPointsEarned(), result.getCurrentScore());

        return result;
    }

    @Override
    public void skipQuestion(UUID gameId, UUID participantId) {
        log.debug("Participant {} skipping question in game {}", participantId, gameId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        validateParticipantAccess(game, participant);

        Question question = questionRepository.findById(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        boolean alreadyAnswered = answerRepository.existsByGameAndParticipantAndQuestion(
                game, participant, question
        );
        if (alreadyAnswered) {
            log.debug("Participant {} already answered or skipped question {}", participantId, question.getQuestionId());
            return; // Không throw, chỉ return
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

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
        validateHost(game, hostId);

        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        validateParticipantAccess(game, participant);

        boolean wasActive = participant.isActive();

        participant.kick(reason);
        participantRepository.save(participant);

        updatePlayerCount(game, -1);

        if (wasActive && game.getGameStatus() == GameStatus.IN_PROGRESS) {
            game.setActivePlayerCount(Math.max(0, game.getActivePlayerCount() - 1));
            gameRepository.save(game);
        }

        checkAndAutoEndGameIfNeeded(game);

        publishGameEvent(gameId, "PARTICIPANT_KICKED", hostId, Map.of(
                "participantId", participantId,
                "nickname", participant.getNickname(),
                "reason", reason,
                "playerCount", game.getPlayerCount()
        ));

        invalidateParticipantsCache(gameId);
    }

    @Override
    public void leaveGame(UUID gameId, UUID participantId) {
        log.info("Participant {} leaving game {}", participantId, gameId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        validateParticipantAccess(game, participant);

        boolean wasActive = participant.isActive();

        participant.leave();
        participantRepository.save(participant);

        updatePlayerCount(game, -1);

        if (wasActive && game.getGameStatus() == GameStatus.IN_PROGRESS) {
            game.setActivePlayerCount(Math.max(0, game.getActivePlayerCount() - 1));
            gameRepository.save(game);
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

        invalidateParticipantsCache(gameId);
    }

    @Override
    @Transactional(readOnly = true)
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


        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

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
    @Transactional(readOnly = true)
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

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
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
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> getFinalLeaderboard(UUID gameId) {
        List<LeaderboardEntryDTO> leaderboard = getLeaderboard(gameId);

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
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
    @Transactional(readOnly = true)
    public GameResponseDTO getGameByPin(String pinCode) {
        Game game = getGameByPinWithValidation(pinCode);
        return gameMapper.toResponseDTO(game);
    }

    @Override
    @Transactional(readOnly = true)
    public Game findGameEntityById(UUID gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
    }

    @Override
    @Transactional(readOnly = true)
    public GameResponseDTO getGameById(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
        return gameMapper.toResponseDTO(game);
    }

    @Override
    @Transactional(readOnly = true)
    public GameDetailDTO getGameDetails(UUID gameId, UUID userId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));

        boolean isHost = game.getHost().getUserId().equals(userId);
        GameParticipant participant = null;

        if (!isHost && userId != null) {
            participant = participantRepository.findByGameAndUser_UserId(game, userId)
                    .orElse(null);
        }

        return gameMapper.toDetailDTO(game, isHost, participant);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GameResponseDTO> getMyGames(UUID userId, Pageable pageable) {
        return gameRepository.findByHostUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(gameMapper::toResponseDTO);
    }

    // ==================== STATISTICS ====================

    @Override
    @Transactional(readOnly = true)
    public GameStatisticsDTO getGameStatistics(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
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
    @Transactional(readOnly = true)
    public UserQuizStatsDTO getUserStatistics(UUID userId, UUID quizId) {
        UserQuizStatistics stats = statsRepository.findByUserUserIdAndQuizQuizId(userId, quizId)
                .orElse(createDefaultStats(userId, quizId));

        return gameMapper.toStatsDTO(stats);
    }

    // ==================== CACHE OPERATIONS ====================

    private Game getGameByPinWithValidation(String pinCode) {
        // Try to get gameId from cache first
        String cacheKey = GAME_PIN_PREFIX + pinCode;
        Object cachedGameId = redisTemplate.opsForValue().get(cacheKey);

        UUID gameId = null;
        if (cachedGameId != null) {
            try {
                gameId = UUID.fromString((String) cachedGameId);
            } catch (Exception e) {
                log.warn("Failed to parse cached gameId: {}", e.getMessage());
            }
        }

        // If gameId found in cache, fetch from DB
        if (gameId != null) {
            return gameRepository.findById(gameId)
                    .orElseThrow(() -> new GameException("Game not found with PIN: " + pinCode));
        }

        // Otherwise, query by PIN
        Game game = gameRepository.findByPinCode(pinCode)
                .orElseThrow(() -> new GameException("Game not found with PIN: " + pinCode));

        // Cache the PIN -> GameId mapping
        cachePinLookup(pinCode, game.getGameId());

        return game;
    }

    private void cachePinLookup(String pinCode, UUID gameId) {
        try {
            String cacheKey = GAME_PIN_PREFIX + pinCode;
            redisTemplate.opsForValue().set(cacheKey, gameId.toString(), PIN_CACHE_TTL_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Failed to cache PIN lookup: {}", e.getMessage());
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

    private void recordParticipantStats(GameParticipant participant, UserAnswer answer) {
        if (answer.isCorrect() && !answer.isTimeout() && !answer.isSkipped()) {
            participant.recordCorrectAnswer(answer.getResponseTimeMs());
        } else if (!answer.isSkipped()) {
            participant.recordIncorrectAnswer(answer.getResponseTimeMs());
        } else {
            participant.recordSkip();
        }
    }

    private void checkAndAutoEndGameIfNeeded(Game game) {
        if (game.getGameStatus() == GameStatus.IN_PROGRESS) {
            if (game.getActivePlayerCount() <= 0) {
                log.warn("No more active players in game {}, auto-ending", game.getGameId());
                game.setGameStatus(GameStatus.FINISHED);
                game.setEndedAt(LocalDateTime.now());
                gameRepository.save(game);

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

    private void validateGameJoinable(Game game, UUID userId) {
        if (game.getHost().getUserId().equals(userId)) {
            throw new GameException("Host cannot join as participant");
        }
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
        invalidateParticipantsCache(game.getGameId());
    }

    private List<Question> getGameQuestionsEager(Game game) {
        // ← DÙNG METHOD MỚI TRONG REPO: đã JOIN FETCH options
        List<Question> questions = questionRepository.findByQuizIdWithOptions(game.getQuiz().getQuizId());

        if (game.isRandomizeQuestions()) {
            Collections.shuffle(questions);
        }

        // Nếu bạn có thiết lập số câu hỏi tối đa khác với số câu trong quiz
        // thì có thể cắt bớt ở đây, ví dụ:
        // return questions.stream().limit(game.getTotalQuestions()).collect(Collectors.toList());

        return questions;
    }

    // ==================== GRADING LOGIC ====================

    // ✅ COMPLETE GRADING LOGIC FOR ALL 14 QUESTION TYPES

    private AnswerGradingResult gradeAnswer(Question question, Object submittedAnswer) {
        try {
            // Ensure options are loaded
            if (question.getOptions() == null || question.getOptions().isEmpty()) {
                Hibernate.initialize(question.getOptions());
            }

            log.info("Grading {} question: {}, submitted: {}",
                    question.getType(), question.getQuestionId(), submittedAnswer);

            return switch (question.getType()) {
                case SINGLE_CHOICE -> gradeSingleChoice(question, submittedAnswer);
                case MULTIPLE_CHOICE -> gradeMultipleChoice(question, submittedAnswer);
                case TRUE_FALSE -> gradeTrueFalse(question, submittedAnswer);
                case FILL_IN_THE_BLANK -> gradeFillInBlank(question, submittedAnswer);
                case SHORT_ANSWER -> gradeShortAnswer(question, submittedAnswer);
                case ESSAY -> gradeEssay(question, submittedAnswer);
                case MATCHING -> gradeMatching(question, submittedAnswer);
                case ORDERING -> gradeOrdering(question, submittedAnswer);
                case DRAG_DROP -> gradeDragDrop(question, submittedAnswer);
                case HOTSPOT -> gradeHotspot(question, submittedAnswer);
                case IMAGE_SELECTION -> gradeImageSelection(question, submittedAnswer);
                case DROPDOWN -> gradeDropdown(question, submittedAnswer);
                case MATRIX -> gradeMatrix(question, submittedAnswer);
                case RANKING -> gradeRanking(question, submittedAnswer);
                default -> {
                    log.warn("Unsupported question type: {}", question.getType());
                    yield new AnswerGradingResult(false, "Unsupported question type");
                }
            };
        } catch (Exception e) {
            log.error("Grading error for question {}: {}", question.getQuestionId(), e.getMessage(), e);
            return new AnswerGradingResult(false, "Grading failed: " + e.getMessage());
        }
    }

    // ==================== 1. SINGLE CHOICE ====================
    private AnswerGradingResult gradeSingleChoice(Question question, Object answer) {
        try {
            UUID selectedId;
            if (answer instanceof String) {
                selectedId = UUID.fromString((String) answer);
            } else if (answer instanceof UUID) {
                selectedId = (UUID) answer;
            } else {
                throw new IllegalArgumentException("Invalid answer type for single choice");
            }

            List<String> correctTexts = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .map(this::getOptionDisplayText)
                    .toList();

            boolean isCorrect = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .map(Option::getOptionId)
                    .anyMatch(id -> id.equals(selectedId));

            String correctAnswer = correctTexts.isEmpty()
                    ? "Không có đáp án đúng"
                    : String.join(", ", correctTexts);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading single choice: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 2. MULTIPLE CHOICE ====================
    private AnswerGradingResult gradeMultipleChoice(Question question, Object answer) {
        try {
            List<UUID> selectedIds;

            if (answer instanceof List<?>) {
                selectedIds = ((List<?>) answer).stream()
                        .map(id -> id instanceof String ? UUID.fromString((String) id) : (UUID) id)
                        .toList();
            } else {
                throw new IllegalArgumentException("Invalid answer type for multiple choice");
            }

            List<String> correctTexts = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .map(this::getOptionDisplayText)
                    .toList();

            Set<UUID> correctIdSet = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .map(Option::getOptionId)
                    .collect(Collectors.toSet());

            boolean isCorrect = new HashSet<>(selectedIds).equals(correctIdSet);

            String correctAnswer = correctTexts.isEmpty()
                    ? "Không có đáp án đúng"
                    : String.join(", ", correctTexts);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading multiple choice: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 3. TRUE/FALSE ====================
    private AnswerGradingResult gradeTrueFalse(Question question, Object answer) {
        try {
            boolean submitted;

            if (answer instanceof Boolean) {
                submitted = (Boolean) answer;
            } else if (answer instanceof String) {
                submitted = Boolean.parseBoolean((String) answer) ||
                        ((String) answer).equalsIgnoreCase("true");
            } else {
                throw new IllegalArgumentException("Invalid answer type for true/false");
            }

            // Get correct answer from first option's correct flag
            boolean correctValue = question.getOptions().stream()
                    .findFirst()
                    .map(Option::isCorrect)
                    .orElse(false);

            boolean isCorrect = submitted == correctValue;
            String correctAnswer = correctValue ? "Đúng" : "Sai";

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading true/false: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    private AnswerGradingResult gradeShortAnswer(Question question, Object answer) {
        try {
            String submitted = String.valueOf(answer).trim();

            ShortAnswerOption sao = (ShortAnswerOption) question.getOptions().get(0);
            String expected = sao.getExpectedAnswer().trim();

            // Case sensitivity
            boolean caseSensitive = !sao.isCaseInsensitive();
            String submittedCompare = caseSensitive ? submitted : submitted.toLowerCase();
            String expectedCompare = caseSensitive ? expected : expected.toLowerCase();

            // ✅ FIX: Basic match (contains OR exact match)
            boolean isCorrect = submittedCompare.equals(expectedCompare) ||
                    submittedCompare.contains(expectedCompare);

            // Check required keywords - ✅ FIX: Parse from JSON string
            String requiredKeywordsJson = sao.getRequiredKeywords();
            if (isCorrect && requiredKeywordsJson != null && !requiredKeywordsJson.isEmpty() && !requiredKeywordsJson.equals("[]")) {
                List<String> requiredKeywords = gameMapper.parseJsonArray(requiredKeywordsJson);
                for (int i = 0; i < requiredKeywords.size(); i++) {
                    String keyword = requiredKeywords.get(i);
                    String keywordCompare = caseSensitive ? keyword : keyword.toLowerCase();
                    if (!submittedCompare.contains(keywordCompare)) {
                        isCorrect = false;
                        break;
                    }
                }
            }

            return new AnswerGradingResult(isCorrect, expected);
        } catch (Exception e) {
            log.error("Error grading short answer: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== FIX FILL IN THE BLANK GRADING ====================
    private AnswerGradingResult gradeFillInBlank(Question question, Object answer) {
        try {
            String submitted = String.valueOf(answer).trim();

            FillInTheBlankOption fbo = (FillInTheBlankOption) question.getOptions().get(0);
            String expected = fbo.getCorrectAnswer().trim();

            // Check case sensitivity
            boolean caseSensitive = !fbo.isCaseInsensitive();
            String submittedCompare = caseSensitive ? submitted : submitted.toLowerCase();
            String expectedCompare = caseSensitive ? expected : expected.toLowerCase();

            boolean isCorrect = submittedCompare.equals(expectedCompare);

            // Check accepted variations if provided - ✅ FIX: Parse from JSON string
            String acceptedVariationsJson = fbo.getAcceptedVariations();
            if (!isCorrect && acceptedVariationsJson != null && !acceptedVariationsJson.isEmpty() && !acceptedVariationsJson.equals("[]")) {
                List<String> acceptedVariations = gameMapper.parseJsonArray(acceptedVariationsJson);
                for (int i = 0; i < acceptedVariations.size(); i++) {
                    String variation = acceptedVariations.get(i);
                    String variationCompare = caseSensitive ? variation : variation.toLowerCase();
                    if (submittedCompare.equals(variationCompare)) {
                        isCorrect = true;
                        break;
                    }
                }
            }

            return new AnswerGradingResult(isCorrect, expected);
        } catch (Exception e) {
            log.error("Error grading fill in the blank: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }


    // ==================== 6. ESSAY ====================
    private AnswerGradingResult gradeEssay(Question question, Object answer) {
        try {
            String submitted = String.valueOf(answer).trim();
            EssayOption eo = (EssayOption) question.getOptions().get(0);

            // Validate word count
            // ✅ FIX: Proper word splitting
            String[] words = submitted.split("\\s+");
            int wordCount = words.length > 0 && !words[0].isEmpty() ? words.length : 0;

            Integer minWords = eo.getMinWords();
            Integer maxWords = eo.getMaxWords();

            int minWordsVal = minWords != null ? minWords : 0;
            int maxWordsVal = maxWords != null ? maxWords : Integer.MAX_VALUE;

            boolean isCorrect = wordCount >= minWordsVal && wordCount <= maxWordsVal && !submitted.isEmpty();

            String samplePreview = eo.getSampleAnswer() != null
                    ? eo.getSampleAnswer().substring(0, Math.min(50, eo.getSampleAnswer().length())) + "..."
                    : "Không có";

            String correctAnswer = String.format(
                    "Bài luận hợp lệ (%d-%d từ). Mẫu: %s",
                    minWordsVal, maxWordsVal, samplePreview
            );

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading essay: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 7. MATCHING ====================
    private AnswerGradingResult gradeMatching(Question question, Object answer) {
        try {
            if (!(answer instanceof Map)) {
                return new AnswerGradingResult(false, "Định dạng ghép nối không hợp lệ");
            }

            Map<?, ?> submitted = (Map<?, ?>) answer;
            List<String> correctMappings = new ArrayList<>();
            int totalPairs = 0;
            int correctCount = 0;

            for (Option opt : question.getOptions()) {
                if (opt instanceof MatchingOption) {
                    totalPairs++;
                    MatchingOption mo = (MatchingOption) opt;
                    String expectedRightItem = mo.getRightItem();
                    String optionIdStr = mo.getOptionId().toString();

                    Object submittedValue = submitted.get(optionIdStr);

                    if (submittedValue != null) {
                        // ✅ FIX: Find the right item text from the selected option
                        String submittedRightText = null;
                        for (Option searchOpt : question.getOptions()) {
                            if (searchOpt instanceof MatchingOption) {
                                MatchingOption searchMo = (MatchingOption) searchOpt;
                                if (searchMo.getOptionId().toString().equals(submittedValue.toString())) {
                                    submittedRightText = searchMo.getRightItem();
                                    break;
                                }
                            }
                        }

                        if (submittedRightText != null && expectedRightItem.equals(submittedRightText)) {
                            correctCount++;
                        }
                    }

                    correctMappings.add(mo.getLeftItem() + " → " + expectedRightItem);
                }
            }

            boolean isCorrect = correctCount == totalPairs && totalPairs > 0;
            String correctAnswer = String.join("; ", correctMappings);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading matching: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }


    // ==================== 8. ORDERING ====================
    private AnswerGradingResult gradeOrdering(Question question, Object answer) {
        try {
            if (!(answer instanceof List)) {
                return new AnswerGradingResult(false, "Định dạng sắp xếp không hợp lệ");
            }

            List<?> submitted = (List<?>) answer;
            List<Option> options = question.getOptions();

            if (submitted.size() != options.size()) {
                return new AnswerGradingResult(false, "Số lượng mục không khớp");
            }

            int correctCount = 0;
            List<String> correctOrder = new ArrayList<>();

            for (int i = 0; i < submitted.size(); i++) {
                Object submittedId = submitted.get(i);

                // ✅ FIX: Find expected option properly
                OrderingOption expectedOption = null;
                for (Option opt : options) {
                    if (opt instanceof OrderingOption) {
                        OrderingOption oo = (OrderingOption) opt;
                        if (oo.getOptionId().toString().equals(submittedId.toString())) {
                            expectedOption = oo;
                            break;
                        }
                    }
                }

                if (expectedOption != null && expectedOption.getCorrectPosition() == (i + 1)) {
                    correctCount++;
                }
            }

            // Build correct answer
            for (Option opt : options) {
                if (opt instanceof OrderingOption) {
                    OrderingOption oo = (OrderingOption) opt;
                    correctOrder.add(oo.getItem());
                }
            }

            boolean isCorrect = correctCount == options.size();
            String correctAnswer = String.join(" → ", correctOrder);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading ordering: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 9. DRAG & DROP ====================
    private AnswerGradingResult gradeDragDrop(Question question, Object answer) {
        try {
            if (!(answer instanceof Map)) {
                return new AnswerGradingResult(false, "Định dạng kéo thả không hợp lệ");
            }

            Map<?, ?> submitted = (Map<?, ?>) answer;

            // ✅ FIX: Count total drag items properly
            int totalItems = 0;
            for (Option opt : question.getOptions()) {
                if (opt instanceof DragDropOption) {
                    totalItems++;
                }
            }

            int correctCount = 0;
            List<String> correctPlacements = new ArrayList<>();

            for (Option opt : question.getOptions()) {
                if (opt instanceof DragDropOption) {
                    DragDropOption ddo = (DragDropOption) opt;
                    String expectedZone = ddo.getDropZoneId();
                    String optionIdStr = ddo.getOptionId().toString();

                    Object submittedZone = submitted.get(optionIdStr);

                    if (submittedZone != null && expectedZone.equals(submittedZone.toString())) {
                        correctCount++;
                    }

                    correctPlacements.add(ddo.getDraggableItem() + " → " + expectedZone);
                }
            }

            boolean isCorrect = correctCount == totalItems && totalItems > 0;
            String correctAnswer = String.join("; ", correctPlacements);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading drag drop: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 10. HOTSPOT ====================
    private AnswerGradingResult gradeHotspot(Question question, Object answer) {
        try {
            if (!(answer instanceof Map)) {
                return new AnswerGradingResult(false, "Định dạng hotspot không hợp lệ");
            }

            Map<?, ?> submitted = (Map<?, ?>) answer;
            Integer submittedX = extractIntFromMap(submitted, "x");
            Integer submittedY = extractIntFromMap(submitted, "y");

            if (submittedX == null || submittedY == null) {
                return new AnswerGradingResult(false, "Tọa độ không hợp lệ");
            }

            HotspotOption ho = (HotspotOption) question.getOptions().get(0);
            String coords = ho.getHotspotCoordinates(); // Format: "x,y" or "x:y"

            // ✅ FIX: Parse coordinates properly
            String[] parts = coords.contains(",") ? coords.split(",") : coords.split(":");
            if (parts.length < 2) {
                return new AnswerGradingResult(false, "Tọa độ hotspot không hợp lệ");
            }

            int expectedX = Integer.parseInt(parts[0].trim());
            int expectedY = Integer.parseInt(parts[1].trim());

            // Allow ±10px tolerance
            boolean isCorrect = Math.abs(submittedX - expectedX) <= 10 &&
                    Math.abs(submittedY - expectedY) <= 10;

            String correctAnswer = String.format("Tọa độ đúng: (%d, %d)", expectedX, expectedY);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading hotspot: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 11. IMAGE SELECTION ====================
    private AnswerGradingResult gradeImageSelection(Question question, Object answer) {
        try {
            UUID selectedId;
            if (answer instanceof String) {
                selectedId = UUID.fromString((String) answer);
            } else if (answer instanceof UUID) {
                selectedId = (UUID) answer;
            } else {
                throw new IllegalArgumentException("Invalid answer type for image selection");
            }

            List<String> correctTexts = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .filter(o -> o instanceof ImageSelectionOption)
                    .map(o -> ((ImageSelectionOption) o).getImageLabel())
                    .toList();

            boolean isCorrect = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .map(Option::getOptionId)
                    .anyMatch(id -> id.equals(selectedId));

            String correctAnswer = correctTexts.isEmpty()
                    ? "Không có hình ảnh đúng"
                    : String.join(", ", correctTexts);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading image selection: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 12. DROPDOWN ====================
    private AnswerGradingResult gradeDropdown(Question question, Object answer) {
        try {
            UUID selectedId;
            if (answer instanceof String) {
                selectedId = UUID.fromString((String) answer);
            } else if (answer instanceof UUID) {
                selectedId = (UUID) answer;
            } else {
                throw new IllegalArgumentException("Invalid answer type for dropdown");
            }

            List<String> correctTexts = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .filter(o -> o instanceof DropdownOption)
                    .map(o -> ((DropdownOption) o).getDisplayLabel())
                    .toList();

            boolean isCorrect = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .map(Option::getOptionId)
                    .anyMatch(id -> id.equals(selectedId));

            String correctAnswer = correctTexts.isEmpty()
                    ? "Không có tùy chọn đúng"
                    : String.join(", ", correctTexts);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading dropdown: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }

    // ==================== 13. MATRIX ====================
    private AnswerGradingResult gradeMatrix(Question question, Object answer) {
        try {
            if (!(answer instanceof String)) {
                return new AnswerGradingResult(false, "Định dạng matrix không hợp lệ");
            }

            String submitted = (String) answer; // Format: "rowId-columnId"
            String[] parts = submitted.split("-");
            if (parts.length != 2) {
                return new AnswerGradingResult(false, "Định dạng tọa độ không hợp lệ");
            }

            String submittedRow = parts[0];
            String submittedCol = parts[1];

            // ✅ FIX: Find correct cell properly
            MatrixOption correctCell = null;
            for (Option opt : question.getOptions()) {
                if (opt instanceof MatrixOption) {
                    MatrixOption mo = (MatrixOption) opt;
                    if (mo.isCorrectCell()) {
                        correctCell = mo;
                        break;
                    }
                }
            }

            boolean isCorrect = false;
            String correctAnswer = "Không có ô đúng";

            if (correctCell != null) {
                isCorrect = correctCell.getRowId().equals(submittedRow) &&
                        correctCell.getColumnId().equals(submittedCol);
                correctAnswer = String.format("%s - %s",
                        correctCell.getRowLabel(),
                        correctCell.getColumnLabel());
            }

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading matrix: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }


    // ==================== 14. RANKING ====================
    private AnswerGradingResult gradeRanking(Question question, Object answer) {
        try {
            if (!(answer instanceof Map)) {
                return new AnswerGradingResult(false, "Định dạng xếp hạng không hợp lệ");
            }

            Map<?, ?> submitted = (Map<?, ?>) answer;
            int correctCount = 0;
            int totalItems = 0;
            List<String> correctRankings = new ArrayList<>();

            for (Option opt : question.getOptions()) {
                if (opt instanceof RankingOption) {
                    RankingOption ro = (RankingOption) opt;
                    totalItems++;

                    Object submittedRankObj = submitted.get(ro.getOptionId().toString());

                    // ✅ FIX: Proper null check with Integer
                    if (submittedRankObj != null) {
                        try {
                            int submittedRank = Integer.parseInt(submittedRankObj.toString());
                            if (submittedRank == ro.getCorrectRank()) {
                                correctCount++;
                            }
                        } catch (NumberFormatException e) {
                            log.warn("Invalid rank value: {}", submittedRankObj);
                        }
                    }

                    correctRankings.add(ro.getRankableItem() + " (#" + ro.getCorrectRank() + ")");
                }
            }

            boolean isCorrect = correctCount == totalItems && totalItems > 0;
            String correctAnswer = String.join("; ", correctRankings);

            return new AnswerGradingResult(isCorrect, correctAnswer);
        } catch (Exception e) {
            log.error("Error grading ranking: {}", e.getMessage());
            return new AnswerGradingResult(false, "Lỗi khi chấm điểm");
        }
    }


    // ==================== HELPER METHODS ====================
    private int calculatePoints(boolean isCorrect, int basePoints, long responseTimeMs, int timeLimitSeconds) {
        if (!isCorrect) {
            return 0;
        }

        int points = basePoints;
        long timeLimitMs = timeLimitSeconds * 1000L;

        // Bonus for fast correct answers
        if (responseTimeMs < timeLimitMs * 0.25) {
            points = (int) (points * 1.2); // 20% bonus
        } else if (responseTimeMs < timeLimitMs * 0.5) {
            points = (int) (points * 1.1); // 10% bonus
        }

        return Math.max(0, points);
    }

    private String getOptionDisplayText(Option option) {
        return switch (option) {
            case SingleChoiceOption sco -> sco.getText();
            case MultipleChoiceOption mco -> mco.getText();
            case TrueFalseOption tfo -> tfo.getText();
            case ImageSelectionOption iso -> iso.getImageLabel() != null ? iso.getImageLabel() : "Hình ảnh";
            case DropdownOption dro -> dro.getDisplayLabel() != null ? dro.getDisplayLabel() : dro.getDropdownValue();
            default -> "Đáp án";
        };
    }

    private Integer extractIntFromMap(Map<?, ?> map, String key) {
        Object val = null;
        try {
            val = map.get(key);

            if (val == null) {
                return null;
            } else if (val instanceof Integer) {
                return (Integer) val;
            } else if (val instanceof Double) {
                return ((Double) val).intValue();
            } else if (val instanceof Long) {
                return ((Long) val).intValue();
            } else if (val instanceof String) {
                return Integer.parseInt((String) val);
            } else if (val instanceof Number) {
                return ((Number) val).intValue();
            }
            return null;
        } catch (NumberFormatException e) {
            log.warn("Failed to parse integer from map key '{}': {}", key, val);
            return null;
        }
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