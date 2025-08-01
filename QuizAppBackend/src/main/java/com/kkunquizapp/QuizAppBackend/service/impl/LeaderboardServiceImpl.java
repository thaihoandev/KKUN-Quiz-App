package com.kkunquizapp.QuizAppBackend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.kkunquizapp.QuizAppBackend.dto.LeaderboardResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.PlayerScoreResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Game;
import com.kkunquizapp.QuizAppBackend.model.Leaderboard;
import com.kkunquizapp.QuizAppBackend.model.Player;
import com.kkunquizapp.QuizAppBackend.repo.*;
import com.kkunquizapp.QuizAppBackend.service.GameService;
import com.kkunquizapp.QuizAppBackend.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

import static com.kkunquizapp.QuizAppBackend.constants.redisKeys.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardServiceImpl implements LeaderboardService {
    private final LeaderboardRepo leaderboardRepository;
    private final PlayerRepo playerRepository;
    private final ModelMapper modelMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    @Transactional
    public void sendLeaderboard(Game game) {
        try {
            List<LeaderboardResponseDTO> leaderboard = updateAndGetLeaderboard(game);

            // Gửi leaderboard qua WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/game/" + game.getGameId() + "/leaderboard",
                    leaderboard
            );

            log.info("Đã gửi leaderboard cho game {}", game.getGameId());
        } catch (Exception e) {
            log.error("Lỗi khi gửi leaderboard cho game {}: {}", game.getGameId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public List<LeaderboardResponseDTO> updateAndGetLeaderboard(Game game) {
        try {
            // Lấy tất cả người chơi đang trong game từ Redis
            Map<Object, Object> playersRedisData = redisTemplate.opsForHash()
                    .entries(GAME_PLAYERS_KEY + game.getGameId());

            // Lấy điểm số từ Redis
            Map<Object, Object> scoreMap = redisTemplate.opsForHash()
                    .entries(PLAYER_SCORE_KEY + game.getGameId());

            String leaderboardKey = GAME_LEADERBOARD_KEY + game.getGameId();

            // Cập nhật điểm số trong ZSet của Redis
            for (Map.Entry<Object, Object> entry : playersRedisData.entrySet()) {
                PlayerResponseDTO playerDTO = (PlayerResponseDTO) entry.getValue();
                if (playerDTO.isInGame()) {
                    String scoreStr = (String) scoreMap.get(playerDTO.getPlayerId().toString());
                    double score = scoreStr != null ? Double.parseDouble(scoreStr) : 0.0;
                    // Cập nhật điểm số vào ZSet
                    redisTemplate.opsForZSet().add(leaderboardKey,
                            playerDTO.getPlayerId().toString(),
                            score);
                }
            }

            // Lấy danh sách đã sắp xếp từ ZSet
            Set<ZSetOperations.TypedTuple<Object>> sortedScores =
                    redisTemplate.opsForZSet().reverseRangeWithScores(leaderboardKey, 0, -1);

            // Chuyển đổi thành list PlayerScoreResponseDTO
            List<PlayerScoreResponseDTO> playerScores = new ArrayList<>();
            int rank = 1;
            for (ZSetOperations.TypedTuple<Object> tuple : sortedScores) {
                UUID playerId = UUID.fromString((String) tuple.getValue());
                double score = tuple.getScore() != null ? tuple.getScore() : 0.0;
                playerScores.add(new PlayerScoreResponseDTO(playerId, (int) score));
            }

            // Lấy thông tin Player từ database
            Map<UUID, Player> playerMap = playerRepository.findAllById(
                    playerScores.stream()
                            .map(PlayerScoreResponseDTO::getPlayerId)
                            .collect(Collectors.toList())
            ).stream().collect(Collectors.toMap(Player::getPlayerId, player -> player));

            // Cập nhật hoặc tạo mới các bản ghi Leaderboard
            List<Leaderboard> leaderboards = new ArrayList<>();
            for (int i = 0; i < playerScores.size(); i++) {
                PlayerScoreResponseDTO ps = playerScores.get(i);
                Player player = playerMap.get(ps.getPlayerId());

                if (player != null) {
                    Leaderboard leaderboard = leaderboardRepository
                            .findByGameAndPlayer(game, player)
                            .orElse(new Leaderboard());

                    leaderboard.setGame(game);
                    leaderboard.setPlayer(player);
                    leaderboard.setRank(i + 1);
                    leaderboard.setTotalScore(ps.getScore());

                    leaderboards.add(leaderboard);
                }
            }

            // Lưu tất cả vào database
            leaderboards = leaderboardRepository.saveAll(leaderboards);

            // Cập nhật thời gian hết hạn cho ZSet
            redisTemplate.expire(leaderboardKey, Duration.ofHours(1));

            // Chuyển đổi sang DTO và trả về
            return leaderboards.stream()
                    .map(this::convertToLeaderboardDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Lỗi khi cập nhật leaderboard cho game {}: {}", game.getGameId(), e.getMessage());
            return Collections.emptyList();
        }
    }


    @Override
    public void updatePlayerScore(UUID gameId, UUID playerId, int scoreToAdd) {
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

    private LeaderboardResponseDTO convertToLeaderboardDTO(Leaderboard leaderboard) {
        LeaderboardResponseDTO dto = modelMapper.map(leaderboard, LeaderboardResponseDTO.class);
        dto.setGameId(leaderboard.getGame().getGameId());
        dto.setPlayerId(leaderboard.getPlayer().getPlayerId());
        return dto;
    }

}
