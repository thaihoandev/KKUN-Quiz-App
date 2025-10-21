package com.kkunquizapp.QuizAppBackend.game.service.impl;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.kkunquizapp.QuizAppBackend.auth.service.JwtService;
import com.kkunquizapp.QuizAppBackend.common.exception.GameNotFoundException;
import com.kkunquizapp.QuizAppBackend.common.exception.GameStateException;
import com.kkunquizapp.QuizAppBackend.common.exception.PlayerNotFoundException;
import com.kkunquizapp.QuizAppBackend.common.exception.QuestionNotFoundException;
import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.model.Game;
import com.kkunquizapp.QuizAppBackend.game.model.enums.GameStatus;
import com.kkunquizapp.QuizAppBackend.game.repository.GameRepo;
import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import com.kkunquizapp.QuizAppBackend.player.dto.PlayerRequestDTO;
import com.kkunquizapp.QuizAppBackend.player.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.player.model.Player;
import com.kkunquizapp.QuizAppBackend.player.repository.PlayerRepo;
import com.kkunquizapp.QuizAppBackend.player.service.LeaderboardService;
import com.kkunquizapp.QuizAppBackend.question.dto.AnswerRequestDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.OptionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.kkunquizapp.QuizAppBackend.constants.redisKeys.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameServiceImpl implements GameService {
    private final GameRepo gameRepository;
    private final PlayerRepo playerRepository;
    private final QuizRepo quizRepository;
    private final QuestionRepo questionRepository;
    private final UserRepo userRepository;

    private final ModelMapper modelMapper;
    private final JwtService jwtService;
    private final LeaderboardService leaderboardService;
    private final TaskScheduler taskScheduler;

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public GameResponseDTO startGameFromQuiz(UUID quizId, String token) {
        String hostId = jwtService.getUserIdFromToken(token.replace("Bearer ", ""));
        User host = userRepository.findById(UUID.fromString(hostId))
                .orElseThrow(() -> new RuntimeException("Host không tồn tại"));

        if (gameRepository.existsByHost_UserIdAndStatusNot(host.getUserId(), GameStatus.COMPLETED)) {
            throw new RuntimeException("Bạn có một game chưa kết thúc. Hãy hoàn thành trước khi tạo mới.");
        }

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz không tồn tại"));

        Game game = new Game();
        game.setQuiz(quiz);
        game.setHost(host);
        game.setPinCode(generateUniquePinCode());
        game.setStatus(GameStatus.WAITING);
        game.setStartTime(LocalDateTime.now());

        Game savedGame = gameRepository.save(game);
        GameResponseDTO responseDTO = convertToGameDTO(savedGame);
        messagingTemplate.convertAndSend("/topic/games/new", responseDTO);

        return responseDTO;
    }

    @Override
    public PlayerResponseDTO joinGame(String pinCode, String token, PlayerRequestDTO request) {
        try {
            log.info("Processing joinGame with pinCode: {}, nickname: {}, playerSession: {}",
                    pinCode, request.getNickname(), request.getPlayerSession());

            Game game = gameRepository.findByPinCode(pinCode)
                    .orElseThrow(() -> {
                        log.error("Game not found for pinCode: {}", pinCode);
                        return new RuntimeException("Game không tồn tại hoặc đã kết thúc");
                    });
            log.info("Found game with ID: {}, status: {}", game.getGameId(), game.getStatus());

            UUID playerIdFromSession = request.getPlayerSession();
            if (playerIdFromSession != null) {
                Optional<Player> existingPlayer = playerRepository.findById(playerIdFromSession);
                if (existingPlayer.isPresent()) {
                    Player player = existingPlayer.get();
                    log.info("Found existing player: {}, inGame: {}, nickname: {}",
                            player.getPlayerId(), player.isInGame(), player.getNickname());

                    if (!player.isInGame()) {
                        player.setInGame(true);
                        Player savedPlayer = playerRepository.save(player);
                        log.info("Updated player {} with inGame=true in database", savedPlayer.getPlayerId());

                        PlayerResponseDTO responseDTO = convertToPlayerDTO(savedPlayer);
                        log.info("Storing player in Redis: key={}, playerId={}, data={}",
                                GAME_PLAYERS_KEY + game.getGameId(), savedPlayer.getPlayerId(), responseDTO);
                        redisTemplate.opsForHash().put(GAME_PLAYERS_KEY + game.getGameId(),
                                savedPlayer.getPlayerId().toString(), responseDTO);

                        List<PlayerResponseDTO> playersInGame = getPlayersInGame(game.getGameId());
                        log.info("Sending WebSocket update to /topic/game/{}/players with {} players",
                                game.getGameId(), playersInGame.size());
                        messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/players", playersInGame);

                        return responseDTO;
                    }
                    log.info("Player {} already in game, skipping join", player.getPlayerId());
                    return convertToPlayerDTO(player);
                }
            }

            if (!game.getStatus().equals(GameStatus.WAITING)) {
                log.error("Cannot join game {}: status is {}", game.getGameId(), game.getStatus());
                throw new RuntimeException("Game đã bắt đầu. Không thể tham gia nữa.");
            }

            Player player = new Player();
            player.setGame(game);
            player.setNickname(request.getNickname());
            player.setScore(0);
            player.setInGame(true);
            game.getPlayers().add(player);
            log.info("Created new player with nickname: {} for game: {}",
                    request.getNickname(), game.getGameId());

            String userIdFromToken = null;
            if (token != null && !token.trim().isEmpty()) {
                try {
                    userIdFromToken = jwtService.getUserIdFromToken(token);
                    log.info("Extracted userId from token: {}", userIdFromToken);
                    if (userIdFromToken != null && !userIdFromToken.trim().isEmpty()) {
                        player.setUserId(UUID.fromString(userIdFromToken));
                        player.setAnonymous(false);
                    } else {
                        player.setAnonymous(true);
                        log.warn("Token provided but userId is empty or null");
                    }
                } catch (Exception e) {
                    log.error("Error decoding token: {}", e.getMessage());
                    player.setAnonymous(true);
                }
            } else {
                player.setAnonymous(true);
                log.info("No token provided, setting player as anonymous");
            }

            Player savedPlayer = playerRepository.save(player);
            log.info("Saved new player to database: playerId={}, nickname={}",
                    savedPlayer.getPlayerId(), savedPlayer.getNickname());

            PlayerResponseDTO responseDTO = convertToPlayerDTO(savedPlayer);

            log.info("Storing player in Redis: key={}, playerId={}, data={}",
                    GAME_PLAYERS_KEY + game.getGameId(), savedPlayer.getPlayerId(), responseDTO);
            redisTemplate.opsForHash().put(GAME_PLAYERS_KEY + game.getGameId(),
                    savedPlayer.getPlayerId().toString(), responseDTO);

            try {
                String payload = new ObjectMapper().writeValueAsString(responseDTO);
                log.info("Publishing player data to Redis channel: game:{}:players, payload={}",
                        game.getGameId(), payload);
                stringRedisTemplate.convertAndSend("game:" + game.getGameId() + ":players", payload);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                log.error("Failed to serialize PlayerResponseDTO to JSON for Redis: {}", e.getMessage());
            }

            List<PlayerResponseDTO> playersInGame = getPlayersInGame(game.getGameId());
            log.info("Sending WebSocket update to /topic/game/{}/players with {} players",
                    game.getGameId(), playersInGame.size());
            messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/players", playersInGame);

            log.info("Join game successful for player: {}, game: {}",
                    savedPlayer.getPlayerId(), game.getGameId());
            return responseDTO;
        } catch (RuntimeException e) {
            log.error("Error joining game with pinCode {}: {}", pinCode, e.getMessage(), e);
            throw new RuntimeException("Không thể tham gia game: " + e.getMessage());
        }
    }

    @Override
    public GameResponseDTO startGame(UUID gameId, String token) {
        Game game = validateHostAndGame(gameId, token);

        if (!game.getStatus().equals(GameStatus.WAITING)) {
            throw new GameStateException("Game đã bắt đầu hoặc kết thúc");
        }

        List<QuestionResponseDTO> allQuestions = loadQuestions(game);
        Game savedGame = updateGameStatus(game);

        saveLeaderboardToRedis(savedGame);

        sendGameUpdates(savedGame, allQuestions, false);

        taskScheduler.schedule(() -> sendQuestionToPlayers(savedGame, allQuestions), Instant.now().plusSeconds(3));

        return convertToGameDTO(savedGame);
    }

    @Override
    public GameResponseDTO endGame(UUID gameId, String token, boolean isAutoEnd) {
        Game game;

        if (isAutoEnd) {
            game = gameRepository.findById(gameId)
                    .orElseThrow(() -> new GameNotFoundException("Không tìm thấy game"));
        } else {
            game = validateHostAndGame(gameId, token);
        }

        game.setStatus(GameStatus.COMPLETED);
        game.setEndTime(LocalDateTime.now());

        gameRepository.save(game);

        try {
            redisTemplate.delete(GAME_STATUS_KEY + gameId);
            redisTemplate.delete(GAME_PLAYERS_KEY + gameId);
            redisTemplate.delete(PLAYER_SCORE_KEY + gameId);
            redisTemplate.delete(GAME_QUESTION_KEY + gameId);
            redisTemplate.delete(GAME_QUESTION_KEY + gameId + ":index");

            log.info("Đã xóa trạng thái game khỏi Redis cho gameId: {}", gameId);
        } catch (Exception e) {
            log.error("Lỗi khi xóa trạng thái game khỏi Redis: {}", e.getMessage());
        }

        GameResponseDTO responseDTO = convertToGameDTO(game);
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/status", responseDTO);

        return responseDTO;
    }

    @Override
    public GameDetailsResponseDTO getGameDetails(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new GameNotFoundException("Không tìm thấy game"));

        List<PlayerResponseDTO> players = getPlayersInGame(gameId);

        GameDetailsResponseDTO responseDTO = new GameDetailsResponseDTO();
        responseDTO.setGame(convertToGameDTO(game));
        responseDTO.setPlayers(players);
        Quiz quiz = quizRepository.findById(game.getQuiz().getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz không tồn tại"));
        responseDTO.setTitle(quiz.getTitle());
        return responseDTO;
    }

    @Override
    public void playerExitBeforeStart(UUID gameId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Người chơi không tồn tại"));

        if (player.getGame().getGameId().equals(gameId)) {
            player.setInGame(false);
            playerRepository.save(player);

            redisTemplate.opsForHash().delete(GAME_PLAYERS_KEY + gameId, player.getPlayerId().toString());
        }
    }

    @Override
    public void playerExit(UUID gameId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player không tồn tại"));

        if (player.getGame().getGameId().equals(gameId)) {
            player.setInGame(false);
            playerRepository.save(player);

            redisTemplate.opsForHash().delete(GAME_PLAYERS_KEY + gameId, player.getPlayerId().toString());
        }
    }

    @Override
    public GameStatus getGameStatus(UUID gameId) {
        ValueOperations<String, String> ops = stringRedisTemplate.opsForValue();
        String status = ops.get(GAME_STATUS_KEY + gameId);
        return status != null ? GameStatus.valueOf(status) : null;
    }

    @Override
    public List<PlayerResponseDTO> getPlayersInGame(UUID gameId) {
        List<Object> players = redisTemplate.opsForHash().values(GAME_PLAYERS_KEY + gameId);
        return players.stream()
                .map(obj -> (PlayerResponseDTO) obj)
                .filter(PlayerResponseDTO::isInGame)
                .collect(Collectors.toList());
    }

    @Override
    public List<PlayerResponseDTO> getLeaderboard(UUID gameId) {
        return getPlayersInGame(gameId);
    }

    @Override
    @Transactional
    public boolean processPlayerAnswer(UUID gameId, AnswerRequestDTO answerRequest) {
        Player player = playerRepository.findById(answerRequest.getPlayerId())
                .orElseThrow(() -> new PlayerNotFoundException("Người chơi không tồn tại"));

        Question question = questionRepository.findById(answerRequest.getQuestionId())
                .orElseThrow(() -> new QuestionNotFoundException("Câu hỏi không tồn tại"));

        String redisKey = GAME_ANSWERED_KEY + gameId + ":" + player.getPlayerId() + ":" + question.getQuestionId();

        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            throw new IllegalStateException("Bạn đã trả lời câu hỏi này rồi!");
        }

        boolean isCorrect = checkAnswer(question, answerRequest.getSelectedOptionIds(), answerRequest.getAnswerStr());

        redisTemplate.opsForValue().set(redisKey, "answered", 1, TimeUnit.HOURS);

        if (isCorrect) {
            player.setScore(player.getScore() + question.getPoints());
            playerRepository.save(player);
            updatePlayerScore(gameId, player.getPlayerId(), question.getPoints());
        }

        return isCorrect;
    }

    private List<QuestionResponseDTO> loadQuestions(Game game) {
        String questionKey = GAME_QUESTION_KEY + game.getGameId();

        List<QuestionResponseDTO> questions = getQuestionsFromRedis(questionKey);

        if (questions == null) {
            questions = loadQuestionsFromDatabase(game);
            saveQuestionsToRedis(questionKey, questions);
        }

        return questions;
    }

    private List<QuestionResponseDTO> getQuestionsFromRedis(String key) {
        try {
            String json = (String) redisTemplate.opsForValue().get(key);
            if (json == null) {
                return null;
            }

            ObjectMapper mapper = new ObjectMapper()
                    .registerModule(new JavaTimeModule())
                    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            return mapper.readValue(json, new TypeReference<List<QuestionResponseDTO>>() {});
        } catch (Exception e) {
            log.error("Lỗi khi đọc câu hỏi từ Redis: {}", e.getMessage());
            redisTemplate.delete(key);
            return null;
        }
    }

    private List<QuestionResponseDTO> loadQuestionsFromDatabase(Game game) {
        List<QuestionResponseDTO> dtos = questionRepository
                .findAllByQuiz(game.getQuiz()).stream()
                .filter(q -> !q.isDeleted())
                .map(this::convertToQuestionDTO)
                .collect(Collectors.toList());

        if (dtos.isEmpty()) {
            throw new GameStateException("Không có câu hỏi nào trong quiz này.");
        }

        return dtos;
    }

    private void saveQuestionsToRedis(String key, List<QuestionResponseDTO> questions) {
        try {
            ObjectMapper mapper = new ObjectMapper()
                    .registerModule(new JavaTimeModule())
                    .setSerializationInclusion(JsonInclude.Include.NON_NULL);

            String json = mapper.writeValueAsString(questions);
            redisTemplate.opsForValue().set(key, json);
            redisTemplate.expire(key, 24, TimeUnit.HOURS);

            log.info("Đã lưu câu hỏi vào Redis thành công với key: {}", key);
        } catch (Exception e) {
            log.error("Lỗi khi lưu câu hỏi vào Redis: {}", e.getMessage());
        }
    }

    private Game updateGameStatus(Game game) {
        game.setStatus(GameStatus.IN_PROGRESS);
        Game savedGame = gameRepository.save(game);

        try {
            String statusKey = GAME_STATUS_KEY + game.getGameId();
            redisTemplate.opsForValue().set(statusKey, GameStatus.IN_PROGRESS.name());
            redisTemplate.expire(statusKey, 24, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật trạng thái game trong Redis: {}", e.getMessage());
        }

        return savedGame;
    }

    public void sendGameUpdates(Game game, List<QuestionResponseDTO> questions, boolean isGameEnded) {
        try {
            GameResponseDTO responseDTO = convertToGameDTO(game);
            messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/status", responseDTO);
            if (isGameEnded) {
                log.info("Game {} kết thúc, gọi endGame().", game.getGameId());
                endGame(game.getGameId(), null, true);
            }
        } catch (Exception e) {
            log.error("Lỗi khi gửi cập nhật qua WebSocket: {}", e.getMessage());
            throw new GameStateException("Không thể gửi cập nhật game qua WebSocket");
        }
    }

    private void updatePlayerScore(UUID gameId, UUID playerId, int scoreToAdd) {
        try {
            String key = PLAYER_SCORE_KEY + gameId;
            String playerScoreStr = (String) redisTemplate.opsForHash().get(key, playerId.toString());
            int currentScore = playerScoreStr != null ? Integer.parseInt(playerScoreStr) : 0;
            int newScore = currentScore + scoreToAdd;

            redisTemplate.opsForHash().put(key, playerId.toString(), String.valueOf(newScore));

            log.info("Đã cập nhật điểm số cho player {} trong game {}: {} -> {}",
                    playerId, gameId, currentScore, newScore);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật điểm số cho player {} trong game {}: {}",
                    playerId, gameId, e.getMessage());
        }
    }

    private Game validateHostAndGame(UUID gameId, String token) {
        String hostId = jwtService.getUserIdFromToken(token.replace("Bearer ", ""));
        User host = userRepository.findById(UUID.fromString(hostId))
                .orElseThrow(() -> new RuntimeException("Host không tồn tại"));

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game không tồn tại"));

        if (!game.getHost().getUserId().equals(host.getUserId())) {
            throw new RuntimeException("Bạn không có quyền thao tác trên game này");
        }
        return game;
    }

    private String generateUniquePinCode() {
        Random random = new Random();
        String pinCode;
        do {
            pinCode = String.format("%06d", random.nextInt(1000000));
        } while (gameRepository.existsByPinCode(pinCode));
        return pinCode;
    }

    private boolean checkAnswer(Question question, List<UUID> selectedOptionIds, String answerStr) {
        QuestionType questionType = question.getQuestionType();

        switch (questionType) {
            case MULTIPLE_CHOICE:
                return checkMultipleChoiceAnswer(question, selectedOptionIds);
            case SINGLE_CHOICE:
                return checkSingleChoiceAnswer(question, selectedOptionIds);
            case TRUE_FALSE:
                return checkTrueFalseAnswer(question, selectedOptionIds);
            case FILL_IN_THE_BLANK:
                return checkFillInTheBlankAnswer(question, answerStr);
            default:
                throw new UnsupportedOperationException("Loại câu hỏi không được hỗ trợ: " + questionType);
        }
    }

    private boolean checkTrueFalseAnswer(Question question, List<UUID> selectedOptionIds) {
        if (selectedOptionIds == null || selectedOptionIds.size() != 1) {
            return false;
        }

        UUID correctOptionId = question.getOptions().stream()
                .filter(TrueFalseOption.class::isInstance)
                .map(opt -> (TrueFalseOption) opt)
                .filter(TrueFalseOption::isCorrect)
                .map(Option::getOptionId)
                .findFirst()
                .orElse(null);

        return correctOptionId != null && correctOptionId.equals(selectedOptionIds.get(0));
    }

    private boolean checkMultipleChoiceAnswer(Question question, List<UUID> selectedOptionIds) {
        if (selectedOptionIds == null || selectedOptionIds.isEmpty()) {
            return false;
        }

        Set<UUID> correctOptionIds = question.getOptions().stream()
                .filter(MultipleChoiceOption.class::isInstance)
                .map(opt -> (MultipleChoiceOption) opt)
                .filter(MultipleChoiceOption::isCorrect)
                .map(Option::getOptionId)
                .collect(Collectors.toSet());

        Set<UUID> userOptionIds = new HashSet<>(selectedOptionIds);

        return userOptionIds.equals(correctOptionIds);
    }

    private boolean checkSingleChoiceAnswer(Question question, List<UUID> selectedOptionIds) {
        if (selectedOptionIds == null || selectedOptionIds.size() != 1) {
            return false;
        }

        UUID correctOptionId = question.getOptions().stream()
                .filter(SingleChoiceOption.class::isInstance)
                .map(opt -> (SingleChoiceOption) opt)
                .filter(SingleChoiceOption::isCorrect)
                .map(Option::getOptionId)
                .findFirst()
                .orElse(null);

        return correctOptionId != null && correctOptionId.equals(selectedOptionIds.get(0));
    }

    private boolean checkFillInTheBlankAnswer(Question question, String answerStr) {
        if (answerStr == null || answerStr.trim().isEmpty()) {
            return false;
        }

        String correctAnswer = question.getOptions().stream()
                .filter(FillInTheBlankOption.class::isInstance)
                .map(opt -> (FillInTheBlankOption) opt)
                .filter(FillInTheBlankOption::isCorrect)
                .map(FillInTheBlankOption::getOptionText)
                .findFirst()
                .orElse(null);

        return correctAnswer != null && answerStr.trim().equalsIgnoreCase(correctAnswer.trim());
    }

    private void saveLeaderboardToRedis(Game game) {
        String leaderboardKey = GAME_LEADERBOARD_KEY + game.getGameId();

        for (Player player : game.getPlayers()) {
            redisTemplate.opsForZSet().add(leaderboardKey, player.getPlayerId().toString(), 0);
        }

        redisTemplate.expire(leaderboardKey, Duration.ofHours(1));
    }

    public void sendQuestionToPlayers(Game game, List<QuestionResponseDTO> allQuestions) {
        String questionIndexKey = GAME_QUESTION_INDEX_KEY + game.getGameId();

        try {
            Integer idx = (Integer) redisTemplate.opsForValue().get(questionIndexKey);
            if (idx == null) {
                idx = 0;
                redisTemplate.opsForValue().set(questionIndexKey, idx);
                log.info("Game {}: Bắt đầu từ câu hỏi đầu.", game.getGameId());
            }

            if (idx >= allQuestions.size()) {
                redisTemplate.delete(questionIndexKey);
                log.info("Game {} đã xong hết câu hỏi.", game.getGameId());
                taskScheduler.schedule(
                        () -> sendGameUpdates(game, allQuestions, true),
                        Instant.now().plusSeconds(5)
                );
                return;
            }

            // 1) Gửi câu hỏi
            QuestionResponseDTO q = allQuestions.get(idx);
            log.info("Game {}: Gửi câu {} – “{}”", game.getGameId(), idx+1, q.getQuestionText());
            messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/question", q);
            redisTemplate.opsForValue().increment(questionIndexKey);

            long timeLimit = q.getTimeLimit() > 0 ? q.getTimeLimit() : 5;
            long revealDelay = 2; // Thời gian show đáp án đúng
            long boardDelay = 5; // Thời gian show leaderboard sau reveal

            // 2) Sau timeLimit => gửi đáp án đúng
            taskScheduler.schedule(() -> {
                log.info("Game {}: Gửi đáp án đúng cho câu {}", game.getGameId(), q.getQuestionId());
                List<OptionResponseDTO> correctOpts = q.getOptions().stream()
                        .filter(dto ->
                                Boolean.TRUE.equals(dto.getCorrect()) ||
                                        (dto.getCorrectAnswer() != null && !dto.getCorrectAnswer().trim().isEmpty())
                        )
                        .collect(Collectors.toList());
                messagingTemplate.convertAndSend(
                        "/topic/game/" + game.getGameId() + "/correct-answer",
                        Map.of(
                                "questionId", q.getQuestionId(),
                                "correctOptions", correctOpts
                        )
                );
            }, Instant.now().plusSeconds(timeLimit));

            // 3) Sau timeLimit + revealDelay => gửi bảng xếp hạng
            taskScheduler.schedule(() -> {
                log.info("Game {}: Gửi leaderboard sau reveal", game.getGameId());
                leaderboardService.sendLeaderboard(game);
            }, Instant.now().plusSeconds(timeLimit + revealDelay));

            // 4) Sau timeLimit + revealDelay + boardDelay => gửi câu hỏi tiếp
            taskScheduler.schedule(() -> {
                log.info("Game {}: Chuẩn bị câu hỏi tiếp", game.getGameId());
                sendQuestionToPlayers(game, allQuestions);
            }, Instant.now().plusSeconds(timeLimit + revealDelay + boardDelay));

        } catch (Exception e) {
            log.error("Lỗi sendQuestionToPlayers game {}: {}", game.getGameId(), e.getMessage());
        }
    }

    private OptionResponseDTO mapOptionToResponseDTO(Option option) {
        if (option instanceof MultipleChoiceOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else if (option instanceof TrueFalseOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else if (option instanceof FillInTheBlankOption) {
            OptionResponseDTO dto = modelMapper.map(option, OptionResponseDTO.class);
            dto.setCorrectAnswer(((FillInTheBlankOption) option).getOptionText());
            return dto;
        } else if (option instanceof SingleChoiceOption) {
            return modelMapper.map(option, OptionResponseDTO.class);
        } else {
            throw new IllegalArgumentException("Unsupported option type");
        }
    }

    private QuestionResponseDTO convertToQuestionDTO(Question question) {
        QuestionResponseDTO responseDTO = modelMapper.map(question, QuestionResponseDTO.class);

        responseDTO.setOptions(question.getOptions().stream()
                .map(this::mapOptionToResponseDTO)
                .collect(Collectors.toList()));

        return responseDTO;
    }

    private GameResponseDTO convertToGameDTO(Game game) {
        GameResponseDTO dto = modelMapper.map(game, GameResponseDTO.class);
        dto.setQuizId(game.getQuiz().getQuizId());
        dto.setHostId(game.getHost().getUserId());
        return dto;
    }

    private PlayerResponseDTO convertToPlayerDTO(Player player) {
        PlayerResponseDTO dto = modelMapper.map(player, PlayerResponseDTO.class);
        dto.setGameId(player.getGame().getGameId());
        if (player.getUserId() != null) {
            dto.setUserId(player.getUserId());
        }
        return dto;
    }
}
