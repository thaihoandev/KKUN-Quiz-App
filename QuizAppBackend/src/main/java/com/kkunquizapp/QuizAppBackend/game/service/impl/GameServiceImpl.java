
// ==================== GAME SERVICE IMPLEMENTATION ====================
package com.kkunquizapp.QuizAppBackend.game.service.impl;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
        import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
@Slf4j
public class GameServiceImpl implements GameService {

    private final GameRepo gameRepository;
    private final GameParticipantRepo participantRepository;
    private final UserAnswerRepo answerRepository;
    private final UserQuizStatisticsRepo statsRepository;
    private final QuizRepo quizRepository;
    private final QuestionRepo questionRepository;
    private final UserRepo userRepository;
    private final QuizService quizService;
    private final GameMapper gameMapper;
    private final ObjectMapper objectMapper;

    // Redis for real-time caching
    private final RedisTemplate<String, Object> redisTemplate;

    // Kafka for event streaming
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String GAME_CACHE_PREFIX = "game:";
    private static final String LEADERBOARD_CACHE_PREFIX = "leaderboard:";
    private static final String PARTICIPANTS_CACHE_PREFIX = "participants:";
    private static final long CACHE_TTL_SECONDS = 300; // 5 minutes

    // ==================== CREATE GAME ====================

    @Override
    public GameResponseDTO createGame(GameCreateRequest request, UUID hostId) {
        log.info("Creating game for quiz: {} by host: {}", request.getQuizId(), hostId);

        // Validate quiz
        Quiz quiz = quizRepository.findByQuizIdAndDeletedFalse(request.getQuizId())
                .orElseThrow(() -> new GameException("Quiz not found"));

        if (!quiz.isPublished()) {
            throw new GameException("Cannot create game for unpublished quiz");
        }

        // Validate host
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new GameException("Host not found"));

        // Generate unique PIN
        String pinCode = generateUniquePinCode();

        // Get questions
        List<Question> questions = questionRepository.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(quiz.getQuizId());
        if (questions.isEmpty()) {
            throw new GameException("Quiz has no questions");
        }

        // Create game
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
        log.info("Game created successfully: {} with PIN: {}", game.getGameId(), pinCode);

        // Cache game in Redis
        cacheGame(game);

        // Send Kafka event
        publishGameEvent(game.getGameId(), "GAME_CREATED", hostId, null);

        // Increment quiz play count
        quizService.incrementPlayCount(quiz.getQuizId());

        return gameMapper.toResponseDTO(game);
    }

    @Override
    public GameParticipantDTO joinGame(String pinCode, JoinGameRequest request, UUID userId) {
        log.info("User {} joining game with PIN: {}", userId, pinCode);

        Game game = getGameFromCacheOrDB(pinCode);
        validateGameJoinable(game);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GameException("User not found"));

        // Check if already joined
        Optional<GameParticipant> existing = participantRepository.findByGameAndUser(game, user);
        if (existing.isPresent()) {
            log.warn("User {} already joined game {}", userId, game.getGameId());
            return gameMapper.toParticipantDTO(existing.get());
        }

        // Create participant
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
        log.info("User {} joined game {} as participant {}", userId, game.getGameId(), participant.getParticipantId());

        // Update game player count
        game.incrementPlayerCount();
        game.setActivePlayerCount(game.getActivePlayerCount() + 1);
        gameRepository.save(game);

        // Update cache
        cacheGame(game);
        invalidateParticipantsCache(game.getGameId());

        // Broadcast join event
        publishGameEvent(game.getGameId(), "PARTICIPANT_JOINED", userId, Map.of(
                "participantId", participant.getParticipantId(),
                "nickname", participant.getNickname(),
                "playerCount", game.getPlayerCount()
        ));

        return gameMapper.toParticipantDTO(participant);
    }

    @Override
    public GameParticipantDTO joinGameAnonymous(String pinCode, JoinGameRequest request) {
        log.info("Anonymous user joining game with PIN: {}", pinCode);

        Game game = getGameFromCacheOrDB(pinCode);
        validateGameJoinable(game);

        if (!game.isAllowAnonymous()) {
            throw new GameException("Anonymous players not allowed in this game");
        }

        // Generate guest token
        String guestToken = UUID.randomUUID().toString();
        LocalDateTime guestExpiry = LocalDateTime.now().plusDays(7);

        // Create anonymous participant
        GameParticipant participant = GameParticipant.builder()
                .game(game)
                .user(null)
                .nickname(request.getNickname())
                .isAnonymous(true)
                .guestToken(guestToken)
                .guestExpiresAt(guestExpiry)
                .status(ParticipantStatus.JOINED)
                .score(0)
                .correctCount(0)
                .build();

        participant = participantRepository.save(participant);
        log.info("Anonymous user joined game {} with guest token {}", game.getGameId(), guestToken);

        // Update game player count
        game.incrementPlayerCount();
        game.setActivePlayerCount(game.getActivePlayerCount() + 1);
        gameRepository.save(game);

        // Update cache
        cacheGame(game);
        invalidateParticipantsCache(game.getGameId());

        // Broadcast join event
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

        Game game = findGameEntityById(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.WAITING) {
            throw new GameException("Game cannot be started in current state: " + game.getGameStatus());
        }

        if (game.getPlayerCount() == 0) {
            throw new GameException("Cannot start game with no players");
        }

        // Start game
        game.startGame();
        game.setGameStatus(GameStatus.STARTING);
        gameRepository.save(game);

        // Update cache
        cacheGame(game);

        // Broadcast start event (countdown)
        publishGameEvent(gameId, "GAME_STARTING", hostId, Map.of(
                "countdown", 3,
                "totalQuestions", game.getTotalQuestions()
        ));

        log.info("Game {} started with {} players", gameId, game.getPlayerCount());

        // Schedule actual game start after countdown
        scheduleGameStart(game);
    }

    private void scheduleGameStart(Game game) {
        // In production, use @Scheduled or Spring Task Scheduler
        new Thread(() -> {
            try {
                Thread.sleep(3000); // 3 second countdown

                game.setGameStatus(GameStatus.IN_PROGRESS);
                gameRepository.save(game);
                cacheGame(game);

                // Move to first question
                moveToNextQuestion(game.getGameId(), game.getHost().getUserId());

            } catch (Exception e) {
                log.error("Error starting game: {}", e.getMessage());
            }
        }).start();
    }

    @Override
    public void pauseGame(UUID gameId, UUID hostId) {
        log.info("Pausing game: {} by host: {}", gameId, hostId);

        Game game = findGameEntityById(gameId);
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

        Game game = findGameEntityById(gameId);
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

        Game game = findGameEntityById(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() == GameStatus.FINISHED || game.getGameStatus() == GameStatus.CANCELLED) {
            throw new GameException("Game already ended");
        }

        // Calculate final statistics
        calculateFinalStatistics(game);

        // End game
        game.endGame();
        gameRepository.save(game);
        cacheGame(game);

        // Update quiz statistics
        quizService.incrementCompletionCount(game.getQuiz().getQuizId());
        quizService.updateAverageScore(game.getQuiz().getQuizId(), game.getAverageScore());

        // Generate final leaderboard
        List<LeaderboardEntryDTO> leaderboard = getFinalLeaderboard(gameId);

        publishGameEvent(gameId, "GAME_ENDED", hostId, Map.of(
                "leaderboard", leaderboard,
                "totalPlayers", game.getPlayerCount(),
                "averageScore", game.getAverageScore()
        ));

        log.info("Game {} ended successfully", gameId);
    }

    @Override
    public void cancelGame(UUID gameId, UUID hostId) {
        log.info("Cancelling game: {} by host: {}", gameId, hostId);

        Game game = findGameEntityById(gameId);
        validateHost(game, hostId);

        game.setGameStatus(GameStatus.CANCELLED);
        game.setEndedAt(LocalDateTime.now());
        gameRepository.save(game);
        cacheGame(game);

        publishGameEvent(gameId, "GAME_CANCELLED", hostId, null);
    }

    // ==================== QUESTION FLOW ====================

    @Override
    public QuestionResponseDTO moveToNextQuestion(UUID gameId, UUID hostId) {
        log.info("Moving to next question in game: {}", gameId);

        Game game = findGameEntityById(gameId);
        validateHost(game, hostId);

        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Game must be in progress");
        }

        // Check if all questions answered
        if (game.getCurrentQuestionIndex() >= game.getTotalQuestions() - 1) {
            log.info("All questions answered, ending game {}", gameId);
            endGame(gameId, hostId);
            throw new GameException("No more questions");
        }

        // Get questions
        List<Question> questions = getGameQuestions(game);

        // Move to next
        game.moveToNextQuestion();
        Question currentQuestion = questions.get(game.getCurrentQuestionIndex());
        game.setCurrentQuestionId(currentQuestion.getQuestionId());
        gameRepository.save(game);
        cacheGame(game);

        log.info("Game {} moved to question {}/{}", gameId, game.getCurrentQuestionIndex() + 1, game.getTotalQuestions());

        // Broadcast question
        broadcastQuestion(gameId);

        return gameMapper.toQuestionDTO(currentQuestion);
    }

    @Override
    public void broadcastQuestion(UUID gameId) {
        Game game = findGameEntityById(gameId);
        Question question = questionRepository.findById(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        // Hide correct answers
        QuestionResponseDTO questionDTO = gameMapper.toQuestionDTOWithoutAnswers(question);

        publishGameEvent(gameId, "QUESTION_STARTED", null, Map.of(
                "question", questionDTO,
                "questionNumber", game.getCurrentQuestionIndex() + 1,
                "totalQuestions", game.getTotalQuestions(),
                "timeLimit", question.getTimeLimitSeconds()
        ));

        // Schedule question end
        scheduleQuestionEnd(game, question.getTimeLimitSeconds());
    }

    private void scheduleQuestionEnd(Game game, int timeLimitSeconds) {
        new Thread(() -> {
            try {
                Thread.sleep(timeLimitSeconds * 1000L);
                endQuestion(game.getGameId());
            } catch (Exception e) {
                log.error("Error ending question: {}", e.getMessage());
            }
        }).start();
    }

    @Override
    public void endQuestion(UUID gameId) {
        log.info("Ending current question for game: {}", gameId);

        Game game = findGameEntityById(gameId);

        // Calculate and broadcast leaderboard
        List<LeaderboardEntryDTO> leaderboard = getLeaderboard(gameId);

        publishGameEvent(gameId, "QUESTION_ENDED", null, Map.of(
                "leaderboard", leaderboard,
                "questionNumber", game.getCurrentQuestionIndex() + 1
        ));

        // Cache leaderboard
        cacheLeaderboard(gameId, leaderboard);
    }

    // ==================== ANSWER SUBMISSION ====================

    @Override
    public AnswerResultDTO submitAnswer(UUID gameId, UUID participantId, SubmitAnswerRequest request) {
        log.debug("Participant {} submitting answer for game {}", participantId, gameId);

        Game game = findGameEntityById(gameId);
        if (game.getGameStatus() != GameStatus.IN_PROGRESS) {
            throw new GameException("Game is not in progress");
        }

        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        Question question = questionRepository.findById(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        // Check if already answered
        boolean alreadyAnswered = answerRepository.existsByGameAndParticipantAndQuestion(game, participant, question);
        if (alreadyAnswered) {
            throw new GameException("Already answered this question");
        }

        // Calculate response time
        long responseTime = Duration.between(game.getQuestionStartTime(), LocalDateTime.now()).toMillis();

        // Grade answer
        AnswerGradingResult grading = gradeAnswer(question, request.getSubmittedAnswer());

        // Calculate points (bonus for speed)
        int points = calculatePoints(grading.isCorrect(), question.getPoints(), responseTime, question.getTimeLimitSeconds());

        // Save answer
        UserAnswer answer = UserAnswer.builder()
                .game(game)
                .participant(participant)
                .question(question)
                .submittedAnswerJson(toJsonString(request.getSubmittedAnswer()))
                .submittedAnswerText(String.valueOf(request.getSubmittedAnswer()))
                .correct(grading.isCorrect())
                .pointsEarned(points)
                .maxPoints(question.getPoints())
                .responseTimeMs(responseTime)
                .isSkipped(false)
                .clientSubmittedAt(request.getSubmittedAt())
                .explanation(question.getExplanation())
                .build();

        answer = answerRepository.save(answer);

        // Update participant stats
        participant.updateScore(points);
        if (grading.isCorrect()) {
            participant.recordCorrectAnswer(responseTime);
        } else {
            participant.recordIncorrectAnswer(responseTime);
        }
        participantRepository.save(participant);

        // Invalidate leaderboard cache
        invalidateLeaderboardCache(gameId);

        // Build result
        AnswerResultDTO result = AnswerResultDTO.builder()
                .correct(grading.isCorrect())
                .pointsEarned(points)
                .responseTimeMs(responseTime)
                .currentScore(participant.getScore())
                .correctAnswer(grading.getCorrectAnswer())
                .explanation(question.getExplanation())
                .build();

        log.debug("Answer processed: correct={}, points={}", grading.isCorrect(), points);
        return result;
    }

    @Override
    public void skipQuestion(UUID gameId, UUID participantId) {
        log.debug("Participant {} skipping question in game {}", participantId, gameId);

        Game game = findGameEntityById(gameId);
        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        Question question = questionRepository.findById(game.getCurrentQuestionId())
                .orElseThrow(() -> new GameException("Current question not found"));

        // Save skip
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

        // Update participant
        participant.recordSkip();
        participantRepository.save(participant);
    }

    // ==================== PARTICIPANT MANAGEMENT ====================

    @Override
    public void kickParticipant(UUID gameId, UUID participantId, UUID hostId, String reason) {
        log.info("Kicking participant {} from game {}", participantId, gameId);

        Game game = findGameEntityById(gameId);
        validateHost(game, hostId);

        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        participant.kick(reason);
        participantRepository.save(participant);

        // Update game count
        game.setActivePlayerCount(game.getActivePlayerCount() - 1);
        gameRepository.save(game);
        cacheGame(game);

        publishGameEvent(gameId, "PARTICIPANT_KICKED", hostId, Map.of(
                "participantId", participantId,
                "nickname", participant.getNickname(),
                "reason", reason
        ));
    }

    @Override
    public void leaveGame(UUID gameId, UUID participantId) {
        log.info("Participant {} leaving game {}", participantId, gameId);

        Game game = findGameEntityById(gameId);
        GameParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new GameException("Participant not found"));

        participant.leave();
        participantRepository.save(participant);

        // Update game count
        game.setActivePlayerCount(game.getActivePlayerCount() - 1);
        gameRepository.save(game);
        cacheGame(game);

        publishGameEvent(gameId, "PARTICIPANT_LEFT", participant.getUser() != null ? participant.getUser().getUserId() : null, Map.of(
                "participantId", participantId,
                "nickname", participant.getNickname()
        ));
    }

    @Override
    public List<GameParticipantDTO> getParticipants(UUID gameId) {
        // Try cache first
        String cacheKey = PARTICIPANTS_CACHE_PREFIX + gameId;
        List<GameParticipantDTO> cached = (List<GameParticipantDTO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // Get from DB
        Game game = findGameEntityById(gameId);
        List<GameParticipant> participants = participantRepository.findByGameAndStatusIn(
                game,
                List.of(ParticipantStatus.JOINED, ParticipantStatus.READY, ParticipantStatus.PLAYING)
        );

        List<GameParticipantDTO> result = participants.stream()
                .map(gameMapper::toParticipantDTO)
                .collect(Collectors.toList());

        // Cache for 1 minute
        redisTemplate.opsForValue().set(cacheKey, result, 60, TimeUnit.SECONDS);

        return result;
    }

    // ==================== LEADERBOARD ====================

    @Override
    public List<LeaderboardEntryDTO> getLeaderboard(UUID gameId) {
        // Try cache first
        String cacheKey = LEADERBOARD_CACHE_PREFIX + gameId;
        List<LeaderboardEntryDTO> cached = (List<LeaderboardEntryDTO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // Calculate from DB
        Game game = findGameEntityById(gameId);
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

        // Cache for 5 seconds during active game
        redisTemplate.opsForValue().set(cacheKey, leaderboard, 5, TimeUnit.SECONDS);

        return leaderboard;
    }

    @Override
    public List<LeaderboardEntryDTO> getFinalLeaderboard(UUID gameId) {
        List<LeaderboardEntryDTO> leaderboard = getLeaderboard(gameId);

        // Update final ranks in DB
        Game game = findGameEntityById(gameId);
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
        Game game = getGameFromCacheOrDB(pinCode);
        return gameMapper.toResponseDTO(game);
    }

    // 1. Dùng trong backend → trả về entity thật
    public Game findGameEntityById(UUID gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Game not found: " + gameId));
    }

    // 2. Dùng cho API response → trả về DTO
    public GameResponseDTO getGameById(UUID gameId) {
        Game game = findGameEntityById(gameId);
        return gameMapper.toResponseDTO(game);
    }

    @Override
    public GameDetailDTO getGameDetails(UUID gameId, UUID userId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameException("Game not found"));

        boolean isHost = game.getHost().getUserId().equals(userId);
        GameParticipant participant = null;

        if (!isHost) {
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
        Game game = findGameEntityById(gameId);
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

    // ==================== HELPER METHODS ====================

    private Game getGameFromCacheOrDB(String pinCode) {
        // Try cache first
        String cacheKey = GAME_CACHE_PREFIX + "pin:" + pinCode;
        Game cached = (Game) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // Get from DB
        Game game = gameRepository.findByPinCode(pinCode)
                .orElseThrow(() -> new GameException("Game not found with PIN: " + pinCode));

        // Cache for 5 minutes
        cacheGame(game);
        return game;
    }

    private void cacheGame(Game game) {
        String cacheKey = GAME_CACHE_PREFIX + game.getGameId();
        String pinCacheKey = GAME_CACHE_PREFIX + "pin:" + game.getPinCode();

        redisTemplate.opsForValue().set(cacheKey, game, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(pinCacheKey, game, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
    }

    private void cacheLeaderboard(UUID gameId, List<LeaderboardEntryDTO> leaderboard) {
        String cacheKey = LEADERBOARD_CACHE_PREFIX + gameId;
        redisTemplate.opsForValue().set(cacheKey, leaderboard, 5, TimeUnit.SECONDS);
    }

    private void invalidateLeaderboardCache(UUID gameId) {
        String cacheKey = LEADERBOARD_CACHE_PREFIX + gameId;
        redisTemplate.delete(cacheKey);
    }

    private void invalidateParticipantsCache(UUID gameId) {
        String cacheKey = PARTICIPANTS_CACHE_PREFIX + gameId;
        redisTemplate.delete(cacheKey);
    }

    private void publishGameEvent(UUID gameId, String eventType, UUID userId, Map<String, Object> data) {
        GameEvent event = GameEvent.builder()
                .gameId(gameId)
                .eventType(eventType)
                .userId(userId)
                .data(data)
                .timestamp(LocalDateTime.now()) // có thể bỏ nếu dùng @Builder.Default
                .build();

        try {
            kafkaTemplate.send("game-events", gameId.toString(), event);
            log.debug("Published event: {} for game: {} by user: {}", eventType, gameId, userId);
        } catch (Exception e) {
            log.error("Failed to publish game event: {} for game: {}", eventType, gameId, e);
        }
    }

    private String generateUniquePinCode() {
        String pin;
        int attempts = 0;
        do {
            pin = String.format("%06d", new Random().nextInt(1000000));
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

    private List<Question> getGameQuestions(Game game) {
        List<Question> questions = questionRepository.findByQuizQuizIdAndDeletedFalseOrderByOrderIndexAsc(game.getQuiz().getQuizId());

        if (game.isRandomizeQuestions()) {
            Collections.shuffle(questions);
        }

        return questions;
    }

    private AnswerGradingResult gradeAnswer(Question question, Object submittedAnswer) {
        // Implement grading logic based on question type
        // This is a simplified version

        boolean isCorrect = false;
        String correctAnswer = "";

        switch (question.getType()) {
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> {
                // Check if selected options are correct
                List<UUID> selectedIds = (List<UUID>) submittedAnswer;
                List<UUID> correctIds = question.getOptions().stream()
                        .filter(opt -> opt.isCorrect())
                        .map(opt -> opt.getOptionId())
                        .collect(Collectors.toList());

                isCorrect = new HashSet<>(selectedIds).equals(new HashSet<>(correctIds));
                correctAnswer = correctIds.toString();
            }
            case TRUE_FALSE -> {
                boolean submitted = (boolean) submittedAnswer;
                boolean correct = question.getOptions().get(0).isCorrect();
                isCorrect = submitted == correct;
                correctAnswer = String.valueOf(correct);
            }
            case FILL_IN_THE_BLANK -> {
                String submitted = ((String) submittedAnswer).trim().toLowerCase();
                String correct = question.getOptions().get(0).getText().trim().toLowerCase();
                isCorrect = submitted.equals(correct);
                correctAnswer = correct;
            }
            default -> {
                // For complex types, implement specific grading logic
                isCorrect = false;
                correctAnswer = "See explanation";
            }
        }

        return new AnswerGradingResult(isCorrect, correctAnswer);
    }

    private int calculatePoints(boolean isCorrect, int basePoints, long responseTimeMs, int timeLimitSeconds) {
        if (!isCorrect) {
            return 0;
        }

        // Base points
        int points = basePoints;

        // Speed bonus (up to 20% extra for answering in first 25% of time)
        long timeLimitMs = timeLimitSeconds * 1000L;
        if (responseTimeMs < timeLimitMs * 0.25) {
            points = (int) (points * 1.2);
        } else if (responseTimeMs < timeLimitMs * 0.5) {
            points = (int) (points * 1.1);
        }

        return points;
    }

    private void calculateFinalStatistics(Game game) {
        List<GameParticipant> participants = participantRepository.findByGame(game);

        if (participants.isEmpty()) {
            return;
        }

        // Calculate average score
        double avgScore = participants.stream()
                .mapToInt(GameParticipant::getScore)
                .average()
                .orElse(0.0);

        game.setAverageScore(avgScore);
        game.setCompletedPlayerCount((int) participants.stream()
                .filter(p -> p.getStatus() == ParticipantStatus.COMPLETED)
                .count());

        // Update user statistics
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
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Error converting to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    // Inner class for grading result
    private static class AnswerGradingResult {
        private final boolean correct;
        private final String correctAnswer;

        public AnswerGradingResult(boolean correct, String correctAnswer) {
            this.correct = correct;
            this.correctAnswer = correctAnswer;
        }

        public boolean isCorrect() {
            return correct;
        }

        public String getCorrectAnswer() {
            return correctAnswer;
        }
    }
}