import { ApiResponseDTO, CreateGameSessionResponse, GameDetailsResponseDTO, PlayerRequestDTO, PlayerResponseDTO } from "@/interfaces";
import axiosInstance from "./axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";


// Hàm tham gia phòng game
export const joinGame = async (
  pinCode: string,
  nickname: string,
  playerSession?: string
): Promise<PlayerResponseDTO> => {
  if (!nickname.trim()) {
    throw new Error("Nickname cannot be empty");
  }

  try {
    const response = await axiosInstance.post<PlayerResponseDTO>(
      `/games/join?pinCode=${pinCode}`,
      {
        nickname: nickname.trim(),
        playerSession: playerSession || null,
        isAnonymous: true,
        score: 0,
      } as PlayerRequestDTO
    );
    if (response.data.playerId) {
      localStorage.setItem("playerSession", response.data.playerId); // Lưu playerId làm session
    }
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Hàm lấy thông tin game và danh sách người chơi
export const fetchGameData = async (gameId: string): Promise<GameDetailsResponseDTO> => {
  try {
    const response = await axiosInstance.get<GameDetailsResponseDTO>(`/games/${gameId}/details`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error("Failed to fetch game data");
  }
};

// Hàm tạo phiên game
export const createGameSession = async (
  quizId: string
): Promise<CreateGameSessionResponse> => {
  try {
    console.log("Creating game session for quizId:", quizId);
    const response = await axiosInstance.post<CreateGameSessionResponse>(
      `/games/create`,
      {
        quizId,
      }
    );
    console.log("Create game session response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating game session:", error);
    handleApiError(error);
    throw error;
  }
};

// Hàm hủy game
export const cancelGame = async (gameId: string): Promise<void> => {
  try {
    console.log("Canceling game:", gameId);
    const response = await axiosInstance.post(`/games/${gameId}/end`, {});
    console.log("Cancel game response status:", response.status);
    console.log("Game canceled successfully:", response.data);
  } catch (error) {
    console.error("Error canceling game:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(errorMessage);
  }
};

// Hàm bắt đầu game
export const startGame = async (gameId: string): Promise<void> => {
  try {
    console.log("Starting game:", gameId);
    const response = await axiosInstance.post(`/games/${gameId}/start`, {});
    console.log("Start game response status:", response.status);
    console.log("Game started successfully:", response.data);
  } catch (error) {
    console.error("Error starting game:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(errorMessage);
  }
};



export const submitAnswer = async (
  gameId: string,
  payload: {
    playerId: string;
    questionId: string;
    selectedOptionIds: string[];
    answerStr: string;
  }
): Promise<ApiResponseDTO> => {
  try {
    const response = await axiosInstance.post(`/games/${gameId}/answer`, payload);
    console.log("Raw answer submission response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    if (typeof response.data !== 'object' || response.data === null) {
      throw new Error("Invalid response format: expected JSON object");
    }
    const data = response.data as ApiResponseDTO;
    if (!data.success && data.message) {
      throw new Error(data.message);
    }
    return data;
  } catch (error: any) {
    console.error("Raw error response:", {
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.message || error.message || 'Failed to submit answer');
  }
};

export const fetchLeaderboard = async (gameId: string): Promise<PlayerResponseDTO[]> => {
  try {
    const response = await axiosInstance.get(`/games/${gameId}/leaderboard`);
    console.log("Raw leaderboard response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    return response.data as PlayerResponseDTO[];
  } catch (error: any) {
    console.error("Raw error response:", {
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch leaderboard');
  }
};

export const fetchGameDetails = async (gameId: string): Promise<GameDetailsResponseDTO> => {
  try {
    const response = await axiosInstance.get(`/games/${gameId}/details`);
    console.log("Raw game details response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    return response.data as GameDetailsResponseDTO;
  } catch (error: any) {
    console.error("Raw error response:", {
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch game details');
  }
};

export const fetchPlayers = async (gameId: string): Promise<PlayerResponseDTO[]> => {
  try {
    const response = await axiosInstance.get(`/games/${gameId}/players`);
    console.log("Raw players response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    return response.data as PlayerResponseDTO[];
  } catch (error: any) {
    console.error("Raw error response:", {
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch players');
  }
};