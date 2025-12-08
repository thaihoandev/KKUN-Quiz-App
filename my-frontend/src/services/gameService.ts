// src/services/gameService.ts
import axiosInstance from "./axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";
import type {
    GameResponseDTO,
    GameDetailDTO,
    GameParticipantDTO,
    QuestionResponseDTO,
    AnswerResultDTO,
    LeaderboardEntryDTO,
    GameCreateRequest,
    JoinGameRequest,
    SubmitAnswerRequest,
    GameStatisticsDTO,
    UserQuizStatsDTO,
} from "@/types/game";
import { webSocketService } from "./webSocketService";

// ==================== HOST ACTIONS ====================

/**
 * Tạo game mới
 * @param request - Game creation parameters
 * @returns Created game info
 */
export const createGame = async (
    request: GameCreateRequest
): Promise<GameResponseDTO> => {
    try {
        const response = await axiosInstance.post<GameResponseDTO>(
            "/games/create",
            request
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Bắt đầu game (có countdown 3s)
 */
export const startGame = async (gameId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/games/${gameId}/start`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Tạm dừng game
 */
export const pauseGame = async (gameId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/games/${gameId}/pause`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Tiếp tục game
 */
export const resumeGame = async (gameId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/games/${gameId}/resume`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Chuyển sang câu hỏi tiếp theo
 */
export const nextQuestion = async (
    gameId: string
): Promise<QuestionResponseDTO> => {
    try {
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
 * Kết thúc game
 */
export const endGame = async (gameId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/games/${gameId}/end`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Hủy game
 */
export const cancelGame = async (gameId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/games/${gameId}/cancel`);
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Kick người chơi
 */
export const kickParticipant = async (
    gameId: string,
    participantId: string,
    reason = "Kicked by host"
): Promise<void> => {
    try {
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
 * Tham gia game bằng PIN (đã đăng nhập)
 */
export const joinGameAuthenticated = async (
    pinCode: string,
    request: JoinGameRequest
): Promise<GameParticipantDTO> => {
    try {
        const response = await axiosInstance.post<GameParticipantDTO>(
            "/games/join",
            request,
            {
                params: { pinCode },
            }
        );
        return response.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Tham gia game ẩn danh
 */
export const joinGameAnonymous = async (
    pinCode: string,
    request: JoinGameRequest
): Promise<GameParticipantDTO> => {
    try {
        const response = await axiosInstance.post<GameParticipantDTO>(
            "/games/join-anonymous",
            request,
            {
                params: { pinCode },
            }
        );

        const participant = response.data;
        if (participant.guestToken) {
            localStorage.setItem("guestToken", participant.guestToken);
            localStorage.setItem("participantId", participant.participantId);
        }
        return participant;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

/**
 * Rời phòng chơi
 */
export const leaveGame = async (
    gameId: string,
    participantId: string
): Promise<void> => {
    try {
        await axiosInstance.post(`/games/${gameId}/leave`, null, {
            headers: { "X-Participant-Id": participantId },
        });
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// ==================== REAL-TIME ACTIONS (WebSocket) ====================

/**
 * Nộp câu trả lời via WebSocket
 * Cách sử dụng: submitAnswer(gameId, participantId, UUID | UUID[] | boolean | string)
 */
export const submitAnswer = (
    gameId: string,
    participantId: string,
    answer: any
): void => {
    webSocketService.submitAnswer(gameId, participantId, answer);
};

/**
 * Bỏ qua câu hỏi
 */
export const skipQuestion = (gameId: string, participantId: string): void => {
    webSocketService.skipQuestion(gameId, participantId);
};

/**
 * Gửi heartbeat (giữ kết nối sống)
 */
export const sendHeartbeat = (gameId: string, participantId: string): void => {
    webSocketService.sendHeartbeat(gameId, participantId);
};

/**
 * Yêu cầu bảng xếp hạng real-time
 */
export const requestLeaderboard = (gameId: string): void => {
    webSocketService.requestLeaderboard(gameId);
};

/**
 * Yêu cầu danh sách người chơi
 */
export const requestParticipants = (gameId: string): void => {
    webSocketService.requestParticipants(gameId);
};

/**
 * Yêu cầu chi tiết game
 */
export const requestGameDetails = (gameId: string): void => {
    webSocketService.requestGameDetails(gameId);
};

/**
 * Yêu cầu thống kê game
 */
export const requestGameStatistics = (gameId: string): void => {
    webSocketService.requestGameStatistics(gameId);
};

/**
 * Yêu cầu final leaderboard
 */
export const requestFinalLeaderboard = (gameId: string): void => {
    webSocketService.requestFinalLeaderboard(gameId);
};

// ==================== FETCH DATA (HTTP - REST API) ====================

/**
 * Lấy thông tin game bằng PIN (màn hình chờ)
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
 * Lấy chi tiết game (host + player)
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
 * Lấy danh sách người chơi hiện tại (HTTP fallback)
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
 * Lấy bảng xếp hạng real-time (HTTP fallback)
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
 * Lấy bảng xếp hạng cuối cùng
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
 * Lấy lịch sử game đã tạo (host)
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
 * Lấy thống kê game
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
 * Lấy thống kê user-quiz (performance history)
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
 * Setup game event listeners
 * Auto-cleanup with cleanup function
 */
export const setupGameEventListeners = (
    gameId: string,
    callbacks: {
        onGameEvent?: (event: any) => void;
        onQuestionStarted?: (question: any) => void;
        onLeaderboardUpdate?: (leaderboard: any[]) => void;
        onParticipantUpdate?: (participants: any[]) => void;
        onError?: (error: any) => void;
    }
) => {
    const unsubs: (() => void)[] = [];

    if (callbacks.onGameEvent) {
        unsubs.push(webSocketService.onGameEvent(callbacks.onGameEvent));
    }

    if (callbacks.onQuestionStarted) {
        unsubs.push(webSocketService.onQuestion(callbacks.onQuestionStarted));
    }

    if (callbacks.onLeaderboardUpdate) {
        unsubs.push(
            webSocketService.onLeaderboard(callbacks.onLeaderboardUpdate)
        );
    }

    if (callbacks.onParticipantUpdate) {
        unsubs.push(
            webSocketService.onParticipants(callbacks.onParticipantUpdate)
        );
    }

    if (callbacks.onError) {
        unsubs.push(webSocketService.onError(callbacks.onError));
    }

    // Return cleanup function
    return () => {
        unsubs.forEach((unsub) => unsub());
    };
};

/**
 * Setup participant-specific listeners
 */
export const setupParticipantListeners = (
    gameId: string,
    participantId: string,
    callbacks: {
        onAnswerResult?: (result: any) => void;
        onKicked?: (notification: any) => void;
        onConnectionChange?: (connected: boolean) => void;
    }
) => {
    const unsubs: (() => void)[] = [];

    // Subscribe to kick notifications
    webSocketService.subscribeToKickNotifications(gameId, participantId);

    if (callbacks.onAnswerResult) {
        unsubs.push(webSocketService.onAnswerResult(callbacks.onAnswerResult));
    }

    if (callbacks.onKicked) {
        unsubs.push(webSocketService.onKicked(callbacks.onKicked));
    }

    if (callbacks.onConnectionChange) {
        unsubs.push(
            webSocketService.onConnectionChange(callbacks.onConnectionChange)
        );
    }

    return () => {
        unsubs.forEach((unsub) => unsub());
    };
};

/**
 * Setup host listeners
 */
export const setupHostListeners = (
    gameId: string,
    callbacks: {
        onGameEvent?: (event: any) => void;
        onConnectionChange?: (connected: boolean) => void;
    }
) => {
    const unsubs: (() => void)[] = [];

    webSocketService.joinGameRoom(gameId);
    webSocketService.subscribeToGameDetails(gameId);

    if (callbacks.onGameEvent) {
        unsubs.push(webSocketService.onGameEvent(callbacks.onGameEvent));
    }
    unsubs.push(
        webSocketService.onParticipants((participants) => {
            // Host nhận được danh sách mới → trigger callback nếu cần
            if (callbacks.onGameEvent) {
                callbacks.onGameEvent({
                    eventType: "PARTICIPANTS_UPDATED",
                    data: participants,
                });
            }
        })
    );
    if (callbacks.onConnectionChange) {
        unsubs.push(
            webSocketService.onConnectionChange(callbacks.onConnectionChange)
        );
    }

    return () => {
        unsubs.forEach((unsub) => unsub());
        webSocketService.leaveGameRoom(gameId);
        webSocketService.unsubscribeFromAllGameTopics(gameId);
    };
};

// ==================== SESSION MANAGEMENT ====================

/**
 * Lưu participant session để reconnect sau này
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
    } catch (err) {
        console.error("Lỗi lưu session:", err);
    }
};

/**
 * Lấy participantId từ localStorage
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
 * Check xem có saved anonymous session không
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
 * Xóa session khi rời game
 */
export const clearParticipantSession = () => {
    try {
        localStorage.removeItem("participantId");
        localStorage.removeItem("guestToken");
        localStorage.removeItem("isAnonymous");
    } catch (err) {
        console.error("Lỗi xóa session:", err);
    }
};
