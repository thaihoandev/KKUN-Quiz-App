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

    @Override
    public GameResponseDTO startGameFromQuiz(UUID quizId, String token) {
        // Xác thực và lấy thông tin host
        String hostId = jwtService.getUserIdFromToken(token.replace("Bearer ", ""));
        User host = userRepository.findById(UUID.fromString(hostId))
                .orElseThrow(() -> new RuntimeException("Host không tồn tại"));

        // Kiểm tra xem host có game nào chưa kết thúc hay không
        boolean hasActiveGame = gameRepository.existsByHost_UserIdAndStatusNot(host.getUserId(), GameStatus.COMPLETED);
        if (hasActiveGame) {
            throw new RuntimeException("Bạn đang có một game khác chưa kết thúc. Hãy kết thúc game trước khi tạo mới.");
        }

        // Lấy thông tin quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz không tồn tại"));

        // Tạo mã PIN độc nhất
        String pinCode = generateUniquePinCode();

        // Tạo game mới
        Game game = new Game();
        game.setQuiz(quiz);
        game.setHost(host);
        game.setPinCode(pinCode);
        game.setStatus(GameStatus.WAITING);
        game.setStartTime(LocalDateTime.now());

        Game savedGame = gameRepository.save(game);

        // Chuyển đổi và gửi thông báo
        GameResponseDTO responseDTO = convertToGameDTO(savedGame);
        messagingTemplate.convertAndSend("/topic/games/new", responseDTO);

        return responseDTO;
    }


    @Override
    public GameResponseDTO startGame(UUID gameId, String token) {
        String hostId = jwtService.getUserIdFromToken(token.replace("Bearer ", ""));
        User host = userRepository.findById(UUID.fromString(hostId))
                .orElseThrow(() -> new RuntimeException("Host không tồn tại"));

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game không tồn tại"));

        if (!game.getHost().getUserId().equals(host.getUserId())) {
            throw new RuntimeException("Bạn không có quyền bắt đầu game này");
        }

        if (!game.getStatus().equals(GameStatus.WAITING)) {
            throw new RuntimeException("Game đã được bắt đầu hoặc đã kết thúc");
        }

        game.setStatus(GameStatus.IN_PROGRESS);
        Game savedGame = gameRepository.save(game);

        GameResponseDTO responseDTO = convertToGameDTO(savedGame);
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/status", responseDTO);

        return responseDTO;
    }

    @Override
    public GameResponseDTO endGame(UUID gameId, String token) {
        String hostId = jwtService.getUserIdFromToken(token.replace("Bearer ", ""));
        User host = userRepository.findById(UUID.fromString(hostId))
                .orElseThrow(() -> new RuntimeException("Host không tồn tại"));

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game không tồn tại"));

        if (!game.getHost().getUserId().equals(host.getUserId())) {
            throw new RuntimeException("Bạn không có quyền kết thúc game này");
        }

        game.setStatus(GameStatus.COMPLETED);
        game.setEndTime(LocalDateTime.now());
        Game savedGame = gameRepository.save(game);

        GameResponseDTO responseDTO = convertToGameDTO(savedGame);
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/status", responseDTO);

        return responseDTO;
    }

    @Override
    public GameResponseDTO findByPinCode(String pinCode) {
        Game game = gameRepository.findByPinCode(pinCode)
                .orElseThrow(() -> new RuntimeException("Game không tồn tại hoặc đã kết thúc"));

        return modelMapper.map(game, GameResponseDTO.class);
    }

    @Override
    public List<PlayerResponseDTO> getPlayers(UUID gameId) {
        List<Player> players = playerRepository.findByGame_GameId(gameId);
        return players.stream()
                .map(this::convertToPlayerDTO)
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
        player.setScore(0); // Khởi tạo điểm số ban đầu

        // Nếu có token và không phải anonymous, liên kết với user
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

        // Thông báo người chơi mới
        messagingTemplate.convertAndSend("/topic/game/" + game.getGameId() + "/players", getPlayers(game.getGameId()));

        return responseDTO;
    }


    private String generateUniquePinCode() {
        String pinCode;
        int maxAttempts = 10;
        int attempts = 0;
        Random random = new Random();

        do {
            // Sinh mã PIN gồm 6 chữ số
            pinCode = String.format("%06d", random.nextInt(1000000));

            attempts++;
            if (!gameRepository.existsByPinCode(pinCode)) {
                break;
            }
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            throw new RuntimeException("Không thể tạo PIN code độc nhất");
        }

        return pinCode;
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
        dto.setUserId(player.getUser().getUserId());
        return dto;
    }
}

