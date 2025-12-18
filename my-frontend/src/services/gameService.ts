// src/services/gameService.ts - COMPLETE & UPDATED VERSION

import axiosInstance from "./axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";
import type {
    GameResponseDTO,
    GameDetailDTO,
    GameParticipantDTO,
    QuestionResponseDTO,
    CurrentQuestionResponseDTO,
    QuestionUpdateDTO,
    AnswerResultDTO,
    LeaderboardEntryDTO,
    GameCreateRequest,
    JoinGameRequest,
    SubmitAnswerRequest,
    GameStatisticsDTO,
    UserQuizStatsDTO,
    GameEvent,
    GameEventType,
    HostListenerCallbacks,
    ParticipantListenerCallbacks,
} from "@/types/game";
import { webSocketService } from "./webSocketService";
// ✅ Import GameEventPayload from webSocketService (single source of truth)
import type { GameEventPayload } from "./webSocketService";

// ==================== HOST ACTIONS ====================

/**
 * Create a new game from a quiz
 * @param request - Game creation request with quiz ID and settings
 * @returns Created game details
 */
export const createGame = async (
    request: GameCreateRequest
): Promise<GameResponseDTO> => {
    try {
        logWSOperation("CREATE_GAME", { quizId: request.quizId });
        const response = await axiosInstance.post<GameResponseDTO>(
            "/games/create",
            request
        );
        logWSOperation("GAME_CREATED", { gameId: response.data.gameId });
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Start the game (transitions from WAITING to IN_PROGRESS)
 * Broadcasts first question via WebSocket
 * @param gameId - Game ID
 */
export const startGame = async (gameId: string): Promise<void> => {
    try {
        logWSOperation("START_GAME", { gameId });
        await axiosInstance.post(`/games/${gameId}/start`);

        // ✅ Wait a bit for event to propagate through Kafka
        await new Promise((resolve) => setTimeout(resolve, 500));
        logWSOperation("GAME_STARTED", { gameId });
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Pause the game
 * @param gameId - Game ID
 */
export const pauseGame = async (gameId: string): Promise<void> => {
    try {
        logWSOperation("PAUSE_GAME", { gameId });
        await axiosInstance.post(`/games/${gameId}/pause`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Resume a paused game
 * @param gameId - Game ID
 */
export const resumeGame = async (gameId: string): Promise<void> => {
    try {
        logWSOperation("RESUME_GAME", { gameId });
        await axiosInstance.post(`/games/${gameId}/resume`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Move to next question (host action)
 * @param gameId - Game ID
 * @returns Next question details
 */
export const nextQuestion = async (
    gameId: string
): Promise<QuestionResponseDTO> => {
    try {
        logWSOperation("NEXT_QUESTION", { gameId });
        const response = await axiosInstance.post<QuestionResponseDTO>(
            `/games/${gameId}/next-question`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * End the game (calculates statistics, marks as FINISHED)
 * @param gameId - Game ID
 */
export const endGame = async (gameId: string): Promise<void> => {
    try {
        logWSOperation("END_GAME", { gameId });
        await axiosInstance.post(`/games/${gameId}/end`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Cancel the game
 * @param gameId - Game ID
 */
export const cancelGame = async (gameId: string): Promise<void> => {
    try {
        logWSOperation("CANCEL_GAME", { gameId });
        await axiosInstance.post(`/games/${gameId}/cancel`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Kick a participant from the game
 * @param gameId - Game ID
 * @param participantId - Participant to kick
 * @param reason - Reason for kicking (optional)
 */
export const kickParticipant = async (
    gameId: string,
    participantId: string,
    reason = "Kicked by host"
): Promise<void> => {
    try {
        logWSOperation("KICK_PARTICIPANT", { gameId, participantId, reason });
        await axiosInstance.post(
            `/games/${gameId}/kick/${participantId}`,
            null,
            {
                params: { reason },
            }
        );
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// ==================== PLAYER ACTIONS ====================

/**
 * Join game as authenticated user
 * @param pinCode - Game PIN code
 * @param request - Join request with nickname
 * @returns Participant details
 */
export const joinGameAuthenticated = async (
    pinCode: string,
    request: JoinGameRequest
): Promise<GameParticipantDTO> => {
    try {
        logWSOperation("JOIN_GAME_AUTH", { pinCode });
        const response = await axiosInstance.post<GameParticipantDTO>(
            "/games/join",
            request,
            {
                params: { pinCode },
            }
        );

        const participant = response.data;
        saveParticipantSession(participant.participantId, false);
        logWSOperation("JOINED_AS_AUTH", {
            participantId: participant.participantId,
        });

        return participant;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Join game anonymously
 * @param pinCode - Game PIN code
 * @param request - Join request with nickname
 * @returns Participant details with guest token
 */
export const joinGameAnonymous = async (
    pinCode: string,
    request: JoinGameRequest
): Promise<GameParticipantDTO> => {
    try {
        logWSOperation("JOIN_GAME_ANON", { pinCode });
        const response = await axiosInstance.post<GameParticipantDTO>(
            "/games/join-anonymous",
            request,
            {
                params: { pinCode },
            }
        );

        const participant = response.data;
        saveParticipantSession(participant.participantId, true);
        if (participant.guestToken) {
            localStorage.setItem("guestToken", participant.guestToken);
        }
        logWSOperation("JOINED_AS_ANON", {
            participantId: participant.participantId,
        });

        return participant;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Leave game
 * @param gameId - Game ID
 * @param participantId - Participant leaving
 */
export const leaveGame = async (
    gameId: string,
    participantId: string
): Promise<void> => {
    try {
        logWSOperation("LEAVE_GAME", { gameId, participantId });
        await axiosInstance.post(`/games/${gameId}/leave`, null, {
            headers: { "X-Participant-Id": participantId },
        });

        clearParticipantSession();
        logWSOperation("LEFT_GAME", { gameId });
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// ==================== WEBSOCKET ACTIONS ====================

/**
 * ✅ FIXED: Submit answer via WebSocket
 * Properly delegates to webSocketService with correct STOMP headers
 * @param gameId - Game ID
 * @param participantId - Participant submitting
 * @param answer - The answer (UUID | UUID[] | boolean | string)
 */
export const submitAnswer = (
    gameId: string,
    participantId: string,
    answer: any
): void => {
    webSocketService.submitAnswer(gameId, participantId, answer);
};

/**
 * ✅ FIXED: Skip question via WebSocket
 * @param gameId - Game ID
 * @param participantId - Participant skipping
 */
export const skipQuestion = (gameId: string, participantId: string): void => {
    webSocketService.skipQuestion(gameId, participantId);
};

/**
 * Send heartbeat to keep connection alive
 * @param gameId - Game ID
 * @param participantId - Participant ID
 */
export const sendHeartbeat = (gameId: string, participantId: string): void => {
    webSocketService.sendHeartbeat(gameId, participantId);
};

/**
 * Request leaderboard via WebSocket
 * @param gameId - Game ID
 * @param participantId - Participant requesting
 */
export const requestLeaderboard = (
    gameId: string,
    participantId: string
): void => {
    webSocketService.requestLeaderboard(gameId, participantId);
};

/**
 * Request participants list via WebSocket
 * @param gameId - Game ID
 * @param participantId - Participant requesting
 */
export const requestParticipants = (
    gameId: string,
    participantId: string
): void => {
    webSocketService.requestParticipants(gameId, participantId);
};

/**
 * ✅ FIXED: Request game details via WebSocket
 * Response handled via onGameDetails callback
 * @param gameId - Game ID
 * @param participantId - Participant requesting
 */
export const requestGameDetails = (
    gameId: string,
    participantId: string
): void => {
    webSocketService.requestGameDetails(gameId, participantId);
};

/**
 * ✅ FIXED: Request game statistics via WebSocket
 * Response handled via onGameStatistics callback
 * @param gameId - Game ID
 * @param participantId - Participant requesting
 */
export const requestGameStatistics = (
    gameId: string,
    participantId: string
): void => {
    webSocketService.requestGameStatistics(gameId, participantId);
};

/**
 * Request final leaderboard (after game ends)
 * @param gameId - Game ID
 * @param participantId - Participant requesting
 */
export const requestFinalLeaderboard = (
    gameId: string,
    participantId: string
): void => {
    webSocketService.requestFinalLeaderboard(gameId, participantId);
};

/**
 * ✅ NEW: Request current question
 * Used when player reconnects or joins late
 * @param gameId - Game ID
 * @param participantId - Participant ID
 */
export const requestCurrentQuestion = (
    gameId: string,
    participantId: string
): void => {
    webSocketService.requestCurrentQuestion(gameId, participantId);
};

// ==================== FETCH DATA (REST API) ====================

/**
 * Get game by PIN code
 * @param pinCode - Game PIN code
 * @returns Game details
 */
export const getGameByPin = async (
    pinCode: string
): Promise<GameResponseDTO> => {
    try {
        const response = await axiosInstance.get<GameResponseDTO>(
            `/games/pin/${pinCode}`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Get detailed game information
 * @param gameId - Game ID
 * @returns Game details
 */
export const getGameDetails = async (
    gameId: string
): Promise<GameDetailDTO> => {
    try {
        const response = await axiosInstance.get<GameDetailDTO>(
            `/games/${gameId}`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * ✅ NEW: Get current question for a game
 * Used by host to know what question is being asked
 * @param gameId - Game ID
 * @returns Current question with timing info
 */
export const getCurrentQuestion = async (
    gameId: string
): Promise<CurrentQuestionResponseDTO> => {
    try {
        const response = await axiosInstance.get<CurrentQuestionResponseDTO>(
            `/games/${gameId}/current-question`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Get list of participants in game
 * @param gameId - Game ID
 * @returns Array of participants
 */
export const getParticipants = async (
    gameId: string
): Promise<GameParticipantDTO[]> => {
    try {
        const response = await axiosInstance.get<GameParticipantDTO[]>(
            `/games/${gameId}/participants`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Get real-time leaderboard
 * @param gameId - Game ID
 * @returns Array of leaderboard entries
 */
export const getLeaderboard = async (
    gameId: string
): Promise<LeaderboardEntryDTO[]> => {
    try {
        const response = await axiosInstance.get<LeaderboardEntryDTO[]>(
            `/games/${gameId}/leaderboard`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Get final leaderboard (after game ends)
 * @param gameId - Game ID
 * @returns Array of final leaderboard entries
 */
export const getFinalLeaderboard = async (
    gameId: string
): Promise<LeaderboardEntryDTO[]> => {
    try {
        const response = await axiosInstance.get<LeaderboardEntryDTO[]>(
            `/games/${gameId}/final-leaderboard`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Get user's games
 * @param page - Page number (0-based)
 * @param size - Items per page
 * @returns Paginated games
 */
export const getMyGames = async (
    page = 0,
    size = 20
): Promise<{ content: GameResponseDTO[]; totalElements: number }> => {
    try {
        const response = await axiosInstance.get("/games/my-games", {
            params: { page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Get game statistics (after game ends)
 * @param gameId - Game ID
 * @returns Statistics including accuracy, average score, etc.
 */
export const getGameStatistics = async (
    gameId: string
): Promise<GameStatisticsDTO> => {
    try {
        const response = await axiosInstance.get<GameStatisticsDTO>(
            `/games/${gameId}/statistics`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Get user's statistics for a specific quiz
 * @param userId - User ID
 * @param quizId - Quiz ID
 * @returns User quiz statistics
 */
export const getUserQuizStats = async (
    userId: string,
    quizId: string
): Promise<UserQuizStatsDTO> => {
    try {
        const response = await axiosInstance.get<UserQuizStatsDTO>(
            `/games/user/${userId}/quiz/${quizId}/stats`
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// ==================== WEBSOCKET LISTENER SETUP ====================

/**
 * ✅ Setup host listeners
 * Subscribe to all game topics for real-time updates
 * Backend sends events via Kafka → GameEventConsumer → /topic/game/{gameId}
 *
 * @param gameId - Game ID
 * @param callbacks - Host callback handlers
 * @returns Cleanup function to unsubscribe
 */
export const setupHostListeners = (
    gameId: string,
    callbacks: HostListenerCallbacks
): (() => void) => {
    const unsubs: (() => void)[] = [];

    console.log("🔌 [HOST] Setting up listeners for game:", gameId);

    // Join game room
    webSocketService.joinGameRoom(gameId);

    // Subscribe to topics
    webSocketService.subscribeToQuestions(gameId);
    webSocketService.subscribeToLeaderboard(gameId);
    webSocketService.subscribeToParticipants(gameId);

    // Setup callbacks
    callbacks.onGameEvent &&
        unsubs.push(webSocketService.onGameEvent(callbacks.onGameEvent));
    callbacks.onQuestion &&
        unsubs.push(webSocketService.onQuestion(callbacks.onQuestion));
    callbacks.onLeaderboard &&
        unsubs.push(webSocketService.onLeaderboard(callbacks.onLeaderboard));
    callbacks.onParticipants &&
        unsubs.push(webSocketService.onParticipants(callbacks.onParticipants));
    callbacks.onGameDetails &&
        unsubs.push(webSocketService.onGameDetails(callbacks.onGameDetails));
    callbacks.onGameStatistics &&
        unsubs.push(webSocketService.onStatistics(callbacks.onGameStatistics));

    // ✅ BỔ SUNG: Request current state on reconnect
    const handleReconnect = (connected: boolean) => {
        if (connected) {
            console.log("🔄 [HOST] Reconnected - requesting current state");
            requestCurrentQuestion(gameId, "host");
            requestGameDetails(gameId, "host");
            requestLeaderboard(gameId, "host");
            requestParticipants(gameId, "host");
        }
        callbacks.onConnectionChange?.(connected);
    };
    unsubs.push(webSocketService.onConnectionChange(handleReconnect));

    // Cleanup function
    return () => {
        console.log("🧹 [HOST] Cleaning up listeners");
        unsubs.forEach((unsub) => unsub());
        webSocketService.leaveGameRoom(gameId);
        webSocketService.unsubscribeFromAllGameTopics(gameId);
    };
};

/**
 * ✅ Setup participant listeners
 * Complete setup: subscriptions + callbacks + reconnect logic
 *
 * @param gameId - Game ID
 * @param participantId - Participant ID
 * @param callbacks - Participant callback handlers
 * @returns Cleanup function to unsubscribe
 */
export const setupParticipantListeners = (
    gameId: string,
    participantId: string,
    callbacks: ParticipantListenerCallbacks
): (() => void) => {
    const unsubs: (() => void)[] = [];

    console.log("🔌 [PARTICIPANT] Setting up listeners", {
        gameId,
        participantId,
    });

    // Join game room
    webSocketService.joinGameRoom(gameId, participantId);

    // Subscribe to topics
    webSocketService.subscribeToQuestions(gameId);
    webSocketService.subscribeToLeaderboard(gameId);
    webSocketService.subscribeToParticipants(gameId);
    webSocketService.subscribeToKickNotifications(gameId, participantId);

    // Setup callbacks
    callbacks.onQuestion &&
        unsubs.push(webSocketService.onQuestion(callbacks.onQuestion));
    callbacks.onLeaderboard &&
        unsubs.push(webSocketService.onLeaderboard(callbacks.onLeaderboard));
    callbacks.onParticipants &&
        unsubs.push(webSocketService.onParticipants(callbacks.onParticipants));
    callbacks.onAnswerResult &&
        unsubs.push(webSocketService.onAnswerResult(callbacks.onAnswerResult));
    callbacks.onGameDetails &&
        unsubs.push(webSocketService.onGameDetails(callbacks.onGameDetails));
    callbacks.onGameStatistics &&
        unsubs.push(webSocketService.onStatistics(callbacks.onGameStatistics));
    callbacks.onKicked &&
        unsubs.push(webSocketService.onKicked(callbacks.onKicked));
    callbacks.onGameEvent &&
        unsubs.push(webSocketService.onGameEvent(callbacks.onGameEvent));

    // ✅ BỔ SUNG: Catch-up khi reconnect
    const handleReconnect = (connected: boolean) => {
        if (connected) {
            console.log(
                "🔄 [PARTICIPANT] Reconnected - requesting current question"
            );
            requestCurrentQuestion(gameId, participantId);
            requestGameDetails(gameId, participantId);
            requestLeaderboard(gameId, participantId);
            requestParticipants(gameId, participantId);
        }
        callbacks.onConnectionChange?.(connected);
    };
    callbacks.onConnectionChange &&
        unsubs.push(webSocketService.onConnectionChange(handleReconnect));

    // Cleanup function
    return () => {
        console.log("🧹 [PARTICIPANT] Cleaning up listeners");
        unsubs.forEach((unsub) => unsub());
        webSocketService.leaveGameRoom(gameId);
        webSocketService.unsubscribeFromAllGameTopics(gameId);
    };
};

// ==================== SESSION MANAGEMENT ====================

/**
 * Save participant session to localStorage
 * Used to remember participant across page reloads
 * @param participantId - Participant ID
 * @param isAnonymous - Whether participant is anonymous
 */
export const saveParticipantSession = (
    participantId: string | undefined | null,
    isAnonymous: boolean
) => {
    if (!participantId) {
        console.error(
            "participantId không hợp lệ, không lưu session:",
            participantId
        );
        clearParticipantSession();
        return;
    }

    try {
        localStorage.setItem("participantId", participantId.toString());
        localStorage.setItem("isAnonymous", String(isAnonymous));
        console.log(
            "✅ Participant session saved:",
            participantId,
            "anonymous:",
            isAnonymous
        );
    } catch (err) {
        console.error("Lỗi lưu session:", err);
    }
};

/**
 * Get saved participant ID from session
 * @returns Participant ID or null
 */
export const getSavedParticipantId = (): string | null => {
    try {
        return localStorage.getItem("participantId") || null;
    } catch (err) {
        console.error("Lỗi lấy session:", err);
        return null;
    }
};

/**
 * Check if session is for anonymous participant
 * @returns True if anonymous, false otherwise
 */
export const hasSavedAnonymousSession = (): boolean => {
    try {
        const isAnonymous = localStorage.getItem("isAnonymous");
        return isAnonymous === "true";
    } catch (err) {
        console.error("Lỗi check session:", err);
        return false;
    }
};

/**
 * Clear participant session from localStorage
 */
export const clearParticipantSession = () => {
    try {
        localStorage.removeItem("participantId");
        localStorage.removeItem("guestToken");
        localStorage.removeItem("isAnonymous");
        localStorage.removeItem("gameId");
        localStorage.removeItem("currentPinCode");
        console.log("✅ Participant session cleared completely");
    } catch (err) {
        console.error("Lỗi xóa session:", err);
    }
};

/**
 * Get saved guest token (for anonymous users)
 * @returns Guest token or null
 */
export const getSavedGuestToken = (): string | null => {
    try {
        return localStorage.getItem("guestToken") || null;
    } catch (err) {
        console.error("Lỗi lấy guest token:", err);
        return null;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a debug log prefix
 * @param component - Component name
 * @returns Formatted prefix
 */
const createLogPrefix = (component: string): string => {
    return `[GameService.${component}]`;
};

/**
 * Log game event with consistent formatting
 * @param eventType - Event type
 * @param data - Event data (optional)
 */
export const logGameEvent = (eventType: string, data?: any) => {
    console.log(
        `📡 ${createLogPrefix("Event")} ${eventType}`,
        data ? "→" : "",
        data || ""
    );
};

/**
 * Log WebSocket operation
 * @param operation - Operation name
 * @param details - Operation details (optional)
 */
export const logWSOperation = (operation: string, details?: any) => {
    console.log(
        `🔌 ${createLogPrefix("WS")} ${operation}`,
        details ? "→" : "",
        details || ""
    );
};
