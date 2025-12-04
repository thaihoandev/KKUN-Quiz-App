// ==================== GAME SERVICE INTERFACE ====================
package com.kkunquizapp.QuizAppBackend.game.service;

import com.kkunquizapp.QuizAppBackend.game.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface GameService {

    // ==================== CREATE ====================
    GameResponseDTO createGame(GameCreateRequest request, UUID hostId);
    GameParticipantDTO joinGame(String pinCode, JoinGameRequest request, UUID userId);
    GameParticipantDTO joinGameAnonymous(String pinCode, JoinGameRequest request);

    // ==================== GAME CONTROL ====================
    void startGame(UUID gameId, UUID hostId);
    void pauseGame(UUID gameId, UUID hostId);
    void resumeGame(UUID gameId, UUID hostId);
    void endGame(UUID gameId, UUID hostId);
    void cancelGame(UUID gameId, UUID hostId);

    // ==================== QUESTION FLOW ====================
    QuestionResponseDTO moveToNextQuestion(UUID gameId, UUID hostId);
    void broadcastQuestion(UUID gameId);
    void endQuestion(UUID gameId);

    // ==================== ANSWER SUBMISSION ====================
    AnswerResultDTO submitAnswer(UUID gameId, UUID participantId, SubmitAnswerRequest request);
    void skipQuestion(UUID gameId, UUID participantId);

    // ==================== PARTICIPANT MANAGEMENT ====================
    void kickParticipant(UUID gameId, UUID participantId, UUID hostId, String reason);
    void leaveGame(UUID gameId, UUID participantId);
    List<GameParticipantDTO> getParticipants(UUID gameId);

    // ==================== LEADERBOARD ====================
    List<LeaderboardEntryDTO> getLeaderboard(UUID gameId);
    List<LeaderboardEntryDTO> getFinalLeaderboard(UUID gameId);

    // ==================== GAME INFO ====================
    GameResponseDTO getGameByPin(String pinCode);
    GameResponseDTO getGameById(UUID gameId);
    GameDetailDTO getGameDetails(UUID gameId, UUID userId);
    Page<GameResponseDTO> getMyGames(UUID userId, Pageable pageable);

    // ==================== STATISTICS ====================
    GameStatisticsDTO getGameStatistics(UUID gameId);
    UserQuizStatsDTO getUserStatistics(UUID userId, UUID quizId);
}
