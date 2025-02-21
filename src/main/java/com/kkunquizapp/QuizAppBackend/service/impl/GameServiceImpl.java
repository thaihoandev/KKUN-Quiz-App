package com.kkunquizapp.QuizAppBackend.service.impl;

import com.amazonaws.services.kms.model.NotFoundException;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.kkunquizapp.QuizAppBackend.dto.*;
import com.kkunquizapp.QuizAppBackend.exception.GameNotFoundException;
import com.kkunquizapp.QuizAppBackend.exception.GameStateException;
import com.kkunquizapp.QuizAppBackend.exception.PlayerNotFoundException;
import com.kkunquizapp.QuizAppBackend.exception.QuestionNotFoundException;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.model.enums.GameStatus;
import com.kkunquizapp.QuizAppBackend.repo.*;
import com.kkunquizapp.QuizAppBackend.service.GameService;
import com.kkunquizapp.QuizAppBackend.service.JwtService;
import com.kkunquizapp.QuizAppBackend.service.LeaderboardService;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameServiceImpl implements GameService {
    private final GameRepo gameRepository;
    private final PlayerRepo playerRepository;
    private final QuizRepo quizRepository;
    private final QuestionRepo questionRepository;
    private final UserRepo userRepository;
    private final OptionRepo optionRepository;

    private final ModelMapper modelMapper;
    private final JwtService jwtService;
    private final QuestionService questionService;

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String GAME_STATUS_KEY = "game_status:";
    private static final String GAME_PLAYERS_KEY = "game_players:";
    private static final String PLAYER_SCORE_KEY = "player_scores:";
    private static final String GAME_QUESTION_KEY = "game_questions:";
    private static final String GAME_LEADERBOARD_KEY = "game_leaderboard:";
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
            // Kiểm tra game tồn tại
            Game game = gameRepository.findByPinCode(pinCode)
                    .orElseThrow(() -> new RuntimeException("Game không tồn tại hoặc đã kết thúc"));

            // Kiểm tra nếu playerId đã tồn tại trong session
            UUID playerIdFromSession = request.getPlayerSession();

            if (playerIdFromSession != null) {
                Optional<Player> existingPlayer = playerRepository.findById(playerIdFromSession);
                if (existingPlayer.isPresent()) {
                    Player player = existingPlayer.get();

                    // Nếu người chơi đã tham gia trước đó nhưng chưa vào game
                    if (!player.isInGame()) {
                        player.setInGame(true);
                        playerRepository.save(player);

                        // Cập nhật Redis
                        PlayerResponseDTO responseDTO = convertToPlayerDTO(player);
                        redisTemplate.opsForHash().put(GAME_PLAYERS_KEY + game.getGameId(), player.getPlayerId().toString(), responseDTO);

                        // Gửi thông báo WebSocket
                        messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/players", getPlayersInGame(game.getGameId()));

                        return responseDTO;
                    }
                }
            }
            // Kiểm tra trạng thái game
            if (!game.getStatus().equals(GameStatus.WAITING)) {
                throw new RuntimeException("Game đã bắt đầu. Không thể tham gia nữa.");
            }
            // Nếu playerId không có trong session hoặc không tồn tại trong database, tạo người chơi mới
            Player player = new Player();
            player.setGame(game);
            player.setNickname(request.getNickname());
            player.setScore(0);
            player.setInGame(true);
            game.getPlayers().add(player);

            // Kiểm tra token và xác định userId
            String userIdFromToken = null;
            if (token != null && !token.trim().isEmpty()) {
                try {
                    userIdFromToken = jwtService.getUserIdFromToken(token);
                    if (userIdFromToken != null && !userIdFromToken.trim().isEmpty()) {
                        player.setUserId(UUID.fromString(userIdFromToken));
                        player.setAnonymous(false);
                    } else {
                        player.setAnonymous(true);
                    }
                } catch (Exception e) {
                    log.error("Lỗi giải mã token: {}", e.getMessage());
                    player.setAnonymous(true); // Nếu lỗi token, mặc định là ẩn danh
                }
            } else {
                player.setAnonymous(true);
            }

            // Lưu người chơi vào database
            Player savedPlayer = playerRepository.save(player);
            PlayerResponseDTO responseDTO = convertToPlayerDTO(savedPlayer);

            // Lưu vào Redis
            redisTemplate.opsForHash().put(GAME_PLAYERS_KEY + game.getGameId(), savedPlayer.getPlayerId().toString(), responseDTO);

            // Gửi thông báo WebSocket
            messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/players", getPlayersInGame(game.getGameId()));

            return responseDTO;
        } catch (RuntimeException e) {
            log.error("Lỗi khi người chơi tham gia game: {}", e.getMessage());
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

        // Lưu leaderboard vào Redis
        saveLeaderboardToRedis(savedGame);

        // Gửi câu hỏi đầu tiên
        sendGameUpdates(savedGame, allQuestions, false);

        return convertToGameDTO(savedGame);
    }


    @Override
    public GameResponseDTO endGame(UUID gameId, String token, boolean isAutoEnd) {
        Game game;

        // Nếu game tự động kết thúc, bỏ qua xác thực token
        if (isAutoEnd) {
            game = gameRepository.findById(gameId)
                    .orElseThrow(() -> new GameNotFoundException("Không tìm thấy game"));
        } else {
            // Nếu kết thúc game từ API, phải xác thực host
            game = validateHostAndGame(gameId, token);
        }

        game.setStatus(GameStatus.COMPLETED);
        game.setEndTime(LocalDateTime.now());

        gameRepository.save(game);

        // Xóa tất cả trạng thái liên quan trong Redis
        try {
            redisTemplate.delete(GAME_STATUS_KEY + gameId);
            redisTemplate.delete(GAME_PLAYERS_KEY + gameId);
            redisTemplate.delete(PLAYER_SCORE_KEY + gameId);
            redisTemplate.delete(GAME_QUESTION_KEY + gameId); // Xóa danh sách câu hỏi
            redisTemplate.delete(GAME_QUESTION_KEY + gameId + ":index"); // Xóa chỉ số câu hỏi hiện tại

            log.info("Đã xóa trạng thái game khỏi Redis cho gameId: {}", gameId);
        } catch (Exception e) {
            log.error("Lỗi khi xóa trạng thái game khỏi Redis: {}", e.getMessage());
        }

        GameResponseDTO responseDTO = convertToGameDTO(game);
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/status", responseDTO);

        return responseDTO;
    }


    public void playerExitBeforeStart(UUID gameId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Người chơi không tồn tại"));

        if (player.getGame().getGameId().equals(gameId)) {
            player.setInGame(false); // Cập nhật trạng thái người chơi rời game
            playerRepository.save(player); // Lưu lại trong cơ sở dữ liệu

            // Xóa người chơi khỏi Redis nếu cần
            redisTemplate.opsForHash().delete(GAME_PLAYERS_KEY + gameId, player.getNickname());
        }
    }

    public void playerExit(UUID gameId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player không tồn tại"));

        if (player.getGame().getGameId().equals(gameId)) {
            player.setInGame(false); // Đánh dấu người chơi đã rời khỏi game
            playerRepository.save(player); // Lưu trạng thái người chơi rời game

            // Xóa người chơi khỏi Redis nếu cần
            redisTemplate.opsForHash().delete(GAME_PLAYERS_KEY + gameId, player.getNickname());
        }
    }

    public GameStatus getGameStatus(UUID gameId) {
        ValueOperations<String, String> ops = stringRedisTemplate.opsForValue();
        String status = ops.get(GAME_STATUS_KEY + gameId);
        return status != null ? GameStatus.valueOf(status) : null;
    }

    public List<PlayerResponseDTO> getPlayersInGame(UUID gameId) {
        // Lấy tất cả người chơi từ Redis
        List<Object> players = redisTemplate.opsForHash().values(GAME_PLAYERS_KEY + gameId);

        return players.stream()
                .map(obj -> (PlayerResponseDTO) obj)
                .filter(PlayerResponseDTO::isInGame) // Lọc những người chơi còn tham gia game
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean processPlayerAnswer(UUID gameId, AnswerRequestDTO answerRequest) {
        Player player = playerRepository.findById(answerRequest.getPlayerId())
                .orElseThrow(() -> new PlayerNotFoundException("Người chơi không tồn tại"));

        Question question = questionRepository.findById(answerRequest.getQuestionId())
                .orElseThrow(() -> new QuestionNotFoundException("Câu hỏi không tồn tại"));

        boolean isCorrect = checkAnswer(question, answerRequest.getSelectedAnswer());

        // Cộng điểm nếu trả lời đúng
        if (isCorrect) {
            player.setScore(player.getScore() + question.getPoints());
            playerRepository.save(player);
            updatePlayerScore(gameId, player.getPlayerId(), question.getPoints());
        }

        return isCorrect;
    }

    private List<QuestionResponseDTO> loadQuestions(Game game) {
        String questionKey = GAME_QUESTION_KEY + game.getGameId();

        // Thử lấy câu hỏi từ Redis
        List<QuestionResponseDTO> questions = getQuestionsFromRedis(questionKey);

        // Nếu không có trong Redis, lấy từ database
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
            // Nếu có lỗi khi đọc từ Redis, xóa key để tránh cache bị hỏng
            redisTemplate.delete(key);
            return null;
        }
    }

    private List<QuestionResponseDTO> loadQuestionsFromDatabase(Game game) {
        List<Question> questions = questionRepository.findAllByQuiz(game.getQuiz());

        if (questions.isEmpty()) {
            throw new GameStateException("Không có câu hỏi nào trong quiz này.");
        }

        return questions.stream()
                .map(this::convertToQuestionDTO)
                .collect(Collectors.toList());
    }

    private void saveQuestionsToRedis(String key, List<QuestionResponseDTO> questions) {
        try {
            ObjectMapper mapper = new ObjectMapper()
                    .registerModule(new JavaTimeModule())
                    .setSerializationInclusion(JsonInclude.Include.NON_NULL);

            String json = mapper.writeValueAsString(questions);
            redisTemplate.opsForValue().set(key, json);
            // Set thời gian tồn tại cho key (ví dụ: 24 giờ)
            redisTemplate.expire(key, 24, TimeUnit.HOURS);

            log.info("Đã lưu câu hỏi vào Redis thành công với key: {}", key);
        } catch (Exception e) {
            log.error("Lỗi khi lưu câu hỏi vào Redis: {}", e.getMessage());
            // Không throw exception vì đây không phải lỗi nghiêm trọng
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
            // Tiếp tục thực thi vì trạng thái đã được lưu trong database
        }

        return savedGame;
    }

    public void sendGameUpdates(Game game, List<QuestionResponseDTO> questions, boolean isGameEnded) {
        try {
            GameResponseDTO responseDTO = convertToGameDTO(game);
            messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/status", responseDTO);

            if (isGameEnded) {
                log.info("Game {} kết thúc, gọi endGame().", game.getGameId());
                endGame(game.getGameId(),null,true);
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

            // Cập nhật điểm số mới vào Redis
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

    private boolean checkAnswer(Question question, String selectedAnswer) {
        switch (question.getQuestionType()) {
            case TRUE_FALSE:
                return checkTrueFalseAnswer(question, selectedAnswer);
            case MULTIPLE_CHOICE:
                return checkMultipleChoiceAnswer(question, selectedAnswer);
            case FILL_IN_THE_BLANK:
                return checkFillInTheBlankAnswer(question, selectedAnswer);
            default:
                throw new UnsupportedOperationException("Loại câu hỏi không được hỗ trợ");
        }
    }

    private boolean checkTrueFalseAnswer(Question question, String selectedAnswer) {
        TrueFalseOption correctOption = (TrueFalseOption) optionRepository.findByQuestion(question)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đáp án"));
        return correctOption.getValue().toString().equalsIgnoreCase(selectedAnswer);
    }

    private boolean checkMultipleChoiceAnswer(Question question, String selectedAnswer) {
        List<MultipleChoiceOption> correctOptions = optionRepository.findAllByQuestionAndCorrectTrue(question);
        return correctOptions.stream().anyMatch(option -> option.getOptionText().equalsIgnoreCase(selectedAnswer));
    }

    private boolean checkFillInTheBlankAnswer(Question question, String selectedAnswer) {
        FillInTheBlankOption correctOption = (FillInTheBlankOption) optionRepository.findByQuestion(question)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đáp án"));
        return correctOption.getCorrectAnswer().equalsIgnoreCase(selectedAnswer.trim());
    }

    private void saveLeaderboardToRedis(Game game) {
        String leaderboardKey = GAME_LEADERBOARD_KEY + game.getGameId();

        for (Player player : game.getPlayers()) {
            redisTemplate.opsForZSet().add(leaderboardKey, player.getPlayerId().toString(), 0);
        }

        // Đặt thời gian hết hạn cho leaderboard để tránh dữ liệu tồn tại mãi mãi
        redisTemplate.expire(leaderboardKey, Duration.ofHours(1));
    }

    //Convert Entity
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
    private GameResponseDTO convertToGameDTO(Game game) {
        GameResponseDTO dto = modelMapper.map(game, GameResponseDTO.class);
        dto.setQuizId(game.getQuiz().getQuizId());
        dto.setHostId(game.getHost().getUserId());
        return dto;
    }
    private PlayerResponseDTO convertToPlayerDTO(Player player) {
        PlayerResponseDTO dto = modelMapper.map(player, PlayerResponseDTO.class);
        dto.setGameId(player.getGame().getGameId());
        if(player.getUserId() != null){
            dto.setUserId(player.getUserId());
        }
        return dto;
    }
}

