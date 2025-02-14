package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.GameResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;
import com.kkunquizapp.QuizAppBackend.model.Player;
import com.kkunquizapp.QuizAppBackend.model.Quiz;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.enums.GameStatus;
import com.kkunquizapp.QuizAppBackend.repo.GameRepo;
import com.kkunquizapp.QuizAppBackend.repo.PlayerRepo;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.GameService;
import com.kkunquizapp.QuizAppBackend.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameServiceImpl implements GameService {
    private final GameRepo gameRepository;
    private final PlayerRepo playerRepository;
    private final QuizRepo quizRepository;
    private final UserRepo userRepository;
    private final ModelMapper modelMapper;
    private final JwtService jwtService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    private static final String GAME_STATUS_KEY = "game_status:";
    private static final String GAME_PLAYERS_KEY = "game_players:";
    private static final String PLAYER_SCORE_KEY = "player_scores:";

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
    public GameResponseDTO startGame(UUID gameId, String token) {
        Game game = validateHostAndGame(gameId, token);

        if (!game.getStatus().equals(GameStatus.WAITING)) {
            throw new RuntimeException("Game đã bắt đầu hoặc kết thúc");
        }

        game.setStatus(GameStatus.IN_PROGRESS);
        Game savedGame = gameRepository.save(game);
        redisTemplate.opsForValue().set(GAME_STATUS_KEY + gameId, GameStatus.IN_PROGRESS.name());

        GameResponseDTO responseDTO = convertToGameDTO(savedGame);
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/status", responseDTO);

        return responseDTO;
    }

    public GameStatus getGameStatus(UUID gameId) {
        ValueOperations<String, String> ops = stringRedisTemplate.opsForValue();
        String status = ops.get(GAME_STATUS_KEY + gameId);
        return status != null ? GameStatus.valueOf(status) : null;
    }

    @Override
    public GameResponseDTO endGame(UUID gameId, String token) {
        Game game = validateHostAndGame(gameId, token);
        game.setStatus(GameStatus.COMPLETED);
        game.setEndTime(LocalDateTime.now());

        gameRepository.save(game);
        redisTemplate.delete(GAME_STATUS_KEY + gameId);
        redisTemplate.delete(GAME_PLAYERS_KEY + gameId);
        redisTemplate.delete(PLAYER_SCORE_KEY + gameId);

        GameResponseDTO responseDTO = convertToGameDTO(game);
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/status", responseDTO);

        return responseDTO;
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


    public List<PlayerResponseDTO> getPlayersInGame(UUID gameId) {
        List<Object> players = redisTemplate.opsForHash().values(GAME_PLAYERS_KEY + gameId);
        return players.stream()
                .map(obj -> (PlayerResponseDTO) obj)
                .collect(Collectors.toList());
    }

    @Override
    public PlayerResponseDTO joinGame(String pinCode, String token, PlayerRequestDTO request) {
        Game game = gameRepository.findByPinCode(pinCode)
                .orElseThrow(() -> new RuntimeException("Game không tồn tại hoặc đã kết thúc"));

        if (!game.getStatus().equals(GameStatus.WAITING)) {
            throw new RuntimeException("Game đã bắt đầu hoặc đã kết thúc");
        }

        Player player = new Player();
        player.setGame(game);
        player.setNickname(request.getNickname());
        player.setScore(0);
        player.setAnonymous(true);

        if (token != null ) {
            String userIdStr = jwtService.getUserIdFromToken(token.replace("Bearer ", ""));
            UUID userId = UUID.fromString(userIdStr);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User không tồn tại"));
            player.setUser(user);
            player.setAnonymous(false);
        }

        Player savedPlayer = playerRepository.save(player);
        PlayerResponseDTO responseDTO = convertToPlayerDTO(savedPlayer);

        // Lưu vào Redis danh sách người chơi của game
        redisTemplate.opsForHash().put(GAME_PLAYERS_KEY + game.getGameId(), savedPlayer.getPlayerId().toString(), responseDTO);

        messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/players", getPlayersInGame(game.getGameId()));

        return responseDTO;
    }


    private String generateUniquePinCode() {
        Random random = new Random();
        String pinCode;
        do {
            pinCode = String.format("%06d", random.nextInt(1000000));
        } while (gameRepository.existsByPinCode(pinCode));
        return pinCode;
    }

    public void updatePlayerScore(UUID gameId, UUID playerId, int score) {
        redisTemplate.opsForHash().put(PLAYER_SCORE_KEY + gameId, playerId.toString(), String.valueOf(score));
    }

    public int getPlayerScore(UUID gameId, UUID playerId) {
        String score = (String) redisTemplate.opsForHash().get(PLAYER_SCORE_KEY + gameId, playerId.toString());
        return score != null ? Integer.parseInt(score) : 0;
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
        if(player.getUser() != null){
            dto.setUserId(player.getUser().getUserId());
        }
        return dto;
    }
}

