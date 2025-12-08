package com.kkunquizapp.QuizAppBackend.game.service;

import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.model.Game;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Game Service Interface
 * Defines all operations for real-time multiplayer quiz games
 */
public interface GameService {

    // ==================== GAME LIFECYCLE ====================

    /**
     * Create a new game from a quiz
     * @param request Game creation parameters
     * @param hostId User ID of the host
     * @return Created game details
     */
    GameResponseDTO createGame(GameCreateRequest request, UUID hostId);

    /**
     * Start the game (with countdown)
     * @param gameId Game ID
     * @param hostId Host user ID
     */
    void startGame(UUID gameId, UUID hostId);

    /**
     * Pause the game
     * @param gameId Game ID
     * @param hostId Host user ID
     */
    void pauseGame(UUID gameId, UUID hostId);

    /**
     * Resume a paused game
     * @param gameId Game ID
     * @param hostId Host user ID
     */
    void resumeGame(UUID gameId, UUID hostId);

    /**
     * End the game and calculate final results
     * @param gameId Game ID
     * @param hostId Host user ID
     */
    void endGame(UUID gameId, UUID hostId);

    /**
     * Cancel the game
     * @param gameId Game ID
     * @param hostId Host user ID
     */
    void cancelGame(UUID gameId, UUID hostId);

    // ==================== PLAYER JOINING ====================

    /**
     * Join game as authenticated user
     * @param pinCode Game PIN code
     * @param request Join request with nickname
     * @param userId User ID
     * @return Participant details
     */
    GameParticipantDTO joinGame(String pinCode, JoinGameRequest request, UUID userId);

    /**
     * Join game anonymously (guest)
     * @param pinCode Game PIN code
     * @param request Join request with nickname
     * @return Participant details with guest token
     */
    GameParticipantDTO joinGameAnonymous(String pinCode, JoinGameRequest request);

    /**
     * Leave the game
     * @param gameId Game ID
     * @param participantId Participant ID
     */
    void leaveGame(UUID gameId, UUID participantId);

    /**
     * Kick a participant from the game
     * @param gameId Game ID
     * @param participantId Participant ID to kick
     * @param hostId Host user ID
     * @param reason Kick reason
     */
    void kickParticipant(UUID gameId, UUID participantId, UUID hostId, String reason);

    // ==================== QUESTION FLOW ====================

    /**
     * Move to the next question
     * @param gameId Game ID
     * @param hostId Host user ID
     * @return Next question details
     */
    QuestionResponseDTO moveToNextQuestion(UUID gameId, UUID hostId);

    /**
     * Broadcast current question to all participants
     * @param gameId Game ID
     */
    void broadcastQuestion(UUID gameId);

    /**
     * End the current question and show results
     * @param gameId Game ID
     */
    void endQuestion(UUID gameId);

    // ==================== ANSWER SUBMISSION ====================

    /**
     * Submit an answer to the current question
     * @param gameId Game ID
     * @param participantId Participant ID
     * @param request Answer submission request
     * @return Answer result with points and feedback
     */
    AnswerResultDTO submitAnswer(UUID gameId, UUID participantId, SubmitAnswerRequest request);

    /**
     * Skip the current question
     * @param gameId Game ID
     * @param participantId Participant ID
     */
    void skipQuestion(UUID gameId, UUID participantId);

    // ==================== GAME INFORMATION ====================

    /**
     * Get game by PIN code
     * @param pinCode Game PIN
     * @return Game details
     */
    GameResponseDTO getGameByPin(String pinCode);

    /**
     * Get game by ID (returns entity for internal use)
     * @param gameId Game ID
     * @return Game entity
     */
    Game findGameEntityById(UUID gameId);

    /**
     * Get game by ID (returns DTO for API)
     * @param gameId Game ID
     * @return Game response DTO
     */
    GameResponseDTO getGameById(UUID gameId);

    /**
     * Get detailed game information
     * @param gameId Game ID
     * @param userId Current user ID (can be null)
     * @return Detailed game information
     */
    GameDetailDTO getGameDetails(UUID gameId, UUID userId);

    /**
     * Get list of participants in the game
     * @param gameId Game ID
     * @return List of participants
     */
    List<GameParticipantDTO> getParticipants(UUID gameId);

    /**
     * Get games created by a user
     * @param userId User ID
     * @param pageable Pagination parameters
     * @return Page of games
     */
    Page<GameResponseDTO> getMyGames(UUID userId, Pageable pageable);

    // ==================== LEADERBOARD ====================

    /**
     * Get real-time leaderboard
     * @param gameId Game ID
     * @return Current leaderboard
     */
    List<LeaderboardEntryDTO> getLeaderboard(UUID gameId);

    /**
     * Get final leaderboard after game ends
     * @param gameId Game ID
     * @return Final leaderboard with ranks
     */
    List<LeaderboardEntryDTO> getFinalLeaderboard(UUID gameId);

    // ==================== STATISTICS ====================

    /**
     * Get game statistics
     * @param gameId Game ID
     * @return Game statistics
     */
    GameStatisticsDTO getGameStatistics(UUID gameId);

    /**
     * Get user statistics for a specific quiz
     * @param userId User ID
     * @param quizId Quiz ID
     * @return User quiz statistics
     */
    UserQuizStatsDTO getUserStatistics(UUID userId, UUID quizId);
}