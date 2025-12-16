package com.kkunquizapp.QuizAppBackend.game.service;

import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.model.Game;
import com.kkunquizapp.QuizAppBackend.question.model.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Game Service Interface
 * Defines the full contract for real-time multiplayer quiz games.
 */
public interface GameService {

    // ==================== GAME LIFECYCLE ====================

    GameResponseDTO createGame(GameCreateRequest request, UUID hostId);

    void startGame(UUID gameId, UUID hostId);

    void pauseGame(UUID gameId, UUID hostId);

    void resumeGame(UUID gameId, UUID hostId);

    void endGame(UUID gameId, UUID hostId);

    void cancelGame(UUID gameId, UUID hostId);


    // ==================== PLAYER JOINING ====================

    GameParticipantDTO joinGame(String pinCode, JoinGameRequest request, UUID userId);

    GameParticipantDTO joinGameAnonymous(String pinCode, JoinGameRequest request);

    void leaveGame(UUID gameId, UUID participantId);

    void kickParticipant(UUID gameId, UUID participantId, UUID hostId, String reason);

//    void actuallyStartGame(UUID gameId, UUID hostId);
    // ==================== QUESTION FLOW ====================

    QuestionResponseDTO moveToNextQuestion(UUID gameId, UUID hostId);

    void broadcastQuestionFromGameSession(UUID gameId, Question currentQuestion);

    void endQuestion(UUID gameId);


    // ==================== ANSWER SUBMISSION ====================

    AnswerResultDTO submitAnswer(UUID gameId, UUID participantId, SubmitAnswerRequest request);

    void skipQuestion(UUID gameId, UUID participantId);


    // ==================== GAME INFORMATION ====================

    GameResponseDTO getGameByPin(String pinCode);

    Game findGameEntityById(UUID gameId);

    GameResponseDTO getGameById(UUID gameId);

    GameDetailDTO getGameDetails(UUID gameId, UUID userId);

    List<GameParticipantDTO> getParticipants(UUID gameId);

    Page<GameResponseDTO> getMyGames(UUID userId, Pageable pageable);


    // ==================== LEADERBOARD ====================

    List<LeaderboardEntryDTO> getLeaderboard(UUID gameId);

    List<LeaderboardEntryDTO> getFinalLeaderboard(UUID gameId);


    // ==================== STATISTICS ====================

    GameStatisticsDTO getGameStatistics(UUID gameId);

    UserQuizStatsDTO getUserStatistics(UUID userId, UUID quizId);

    CurrentQuestionResponseDTO getCurrentQuestion(UUID gameId);
}
