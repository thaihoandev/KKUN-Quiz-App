"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { toast } from "react-toastify";
import { cancelGame, startGame, fetchGameData } from "@/services/gameService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import avatar1 from "@/assets/img/avatars/1.png";
import avatar2 from "@/assets/img/avatars/2.png";
import avatar3 from "@/assets/img/avatars/3.png";
import avatar4 from "@/assets/img/avatars/4.png";
import avatar5 from "@/assets/img/avatars/5.png";
import avatar6 from "@/assets/img/avatars/6.png";
import avatar7 from "@/assets/img/avatars/7.png";
import avatar8 from "@/assets/img/avatars/8.png";
import avatar9 from "@/assets/img/avatars/9.png";
import avatar10 from "@/assets/img/avatars/10.png";
import avatar11 from "@/assets/img/avatars/11.png";
import avatar12 from "@/assets/img/avatars/12.png";
import avatar13 from "@/assets/img/avatars/13.png";
import avatar14 from "@/assets/img/avatars/14.png";
import avatar15 from "@/assets/img/avatars/15.png";
import { useAuth } from "@/hooks/useAuth";

// Avatar list
const AVATAR_LIST = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
  avatar11,
  avatar12,
  avatar13,
  avatar14,
  avatar15,
];

// Define types
interface GameResponseDTO {
  gameId: string;
  quizId: string;
  hostId: string;
  pinCode: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  startTime: string;
  endTime: string | null;
}

interface PlayerResponseDTO {
  playerId: string;
  nickname: string;
  gameId: string;
  score: number;
  inGame: boolean;
  userId?: string;
  isAnonymous: boolean;
}

interface GameDetailsResponseDTO {
  game: GameResponseDTO;
  players: PlayerResponseDTO[];
  title: string;
}

interface Player {
  playerId: string;
  nickname: string;
  avatar?: string;
  joinedAt: string;
  userId?: string;
}

// QR Code Component
const QRCode: React.FC<{ value: string; size?: number }> = ({ value, size = 150 }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setQrError("No PIN code provided for QR code");
      return;
    }

    // Generate QR code using Google Charts API
    const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(value)}`;
    setQrCodeUrl(qrUrl);
  }, [value, size]);

  if (qrError) {
    return (
      <div className="qr-code-container d-flex flex-column align-items-center">
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          <p className="text-danger mb-0">Error: {qrError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-code-container d-flex flex-column align-items-center">
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <img
          src={qrCodeUrl}
          alt={`QR Code for ${value}`}
          className="d-block"
          width={size}
          height={size}
          style={{ imageRendering: "pixelated" }}
          onError={(e) => {
            setQrError("Failed to load QR code");
            console.error("QR code image failed to load:", qrCodeUrl);
          }}
        />
      </div>
      <small className="text-muted mt-2 text-center">Scan to join</small>
    </div>
  );
};

const WaitingRoomSessionPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const WS_ENDPOINT = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";
  const { user } = useAuth();

  const [gameData, setGameData] = useState<GameResponseDTO | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [usedAvatars, setUsedAvatars] = useState<Set<string>>(new Set());
  const [showQR, setShowQR] = useState<boolean>(false);

  const isHost = useMemo(() => {
    return user?.userId && gameData?.hostId ? user.userId === gameData.hostId : false;
  }, [user, gameData]);

  const currentPlayer = useMemo(() => {
    return players.find((player) => player.userId === user?.userId);
  }, [players, user?.userId]);

  useEffect(() => {
    if (!gameId) {
      setError("No game ID provided");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await fetchGameData(gameId);
        setGameData(data.game);
        setPlayers(
          data.players
            .filter((p) => p.inGame)
            .map((p) => ({
              playerId: p.playerId,
              nickname: p.nickname || "Unknown Player",
              avatar: assignRandomAvatar(),
              joinedAt: new Date().toISOString(),
              userId: p.userId ?? undefined,
            }))
        );
        setQuizTitle(data.title || "Quiz Game");
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load game data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      client.subscribe(`/topic/game/${gameId}/players`, (message) => {
        try {
          const parsedData = JSON.parse(message.body);
          if (Array.isArray(parsedData)) {
            const newPlayers: Player[] = parsedData
              .filter((p: PlayerResponseDTO) => p.inGame)
              .map((p: PlayerResponseDTO) => ({
                playerId: p.playerId,
                nickname: p.nickname || "Unknown Player",
                avatar: assignRandomAvatar(),
                joinedAt: new Date().toISOString(),
                userId: p.userId,
              }));
            setPlayers((prevPlayers) => {
              const playersChanged = !arraysEqual(prevPlayers, newPlayers);
              if (playersChanged) return newPlayers;
              return prevPlayers;
            });
          }
        } catch (error) {
          console.error("Error parsing player message:", error);
        }
      });

      client.subscribe(`/topic/game/${gameId}/status`, (message) => {
        try {
          const statusUpdate: GameResponseDTO = JSON.parse(message.body);
          if (statusUpdate.status === "IN_PROGRESS") {
            navigate(`/game-play/${gameId}`, { replace: true });
          } else if (statusUpdate.status === "COMPLETED" || statusUpdate.status === "CANCELED") {
            localStorage.removeItem("playerSession");
            localStorage.removeItem("gameId");
            if (!isHost) {
              toast.info("The game has been canceled by the host.");
            }
            navigate("/", { replace: true });
          }
        } catch (error) {
          console.error("Error parsing status message:", error);
        }
      });
    };

    client.onStompError = (error) => {
      console.error("WebSocket STOMP error:", error);
    };

    client.onWebSocketError = (error) => {
      console.error("WebSocket connection error:", error);
    };

    client.onDisconnect = () => {
      console.log("WebSocket disconnected");
    };

    client.activate();
    setStompClient(client);

    return () => {
      if (client.active) client.deactivate();
      setStompClient(null);
    };
  }, [gameId, navigate, isHost]);

  useEffect(() => {
    if (!gameId) return;

    const pollGameStatus = setInterval(async () => {
      try {
        const data = await fetchGameData(gameId);
        if (data.game.status === "COMPLETED" || data.game.status === "CANCELED") {
          localStorage.removeItem("playerSession");
          localStorage.removeItem("gameId");
          if (!isHost) {
            toast.info("The game has been canceled by the host.");
          }
          navigate("/", { replace: true });
        } else if (data.game.status === "IN_PROGRESS") {
          navigate(`/game-play/${gameId}`, { replace: true });
        }
      } catch (err) {
        console.error("Error polling game status:", err);
      }
    }, 10000);

    return () => clearInterval(pollGameStatus);
  }, [gameId, navigate, isHost]);

  const assignRandomAvatar = (): string => {
    const availableAvatars = AVATAR_LIST.filter((avatar) => !usedAvatars.has(avatar.toString()));
    if (availableAvatars.length === 0) {
      setUsedAvatars(new Set());
      const randomAvatar = AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)] || unknownAvatar;
      return randomAvatar.toString();
    }
    const randomAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)] || unknownAvatar;
    setUsedAvatars((prev) => new Set(prev).add(randomAvatar.toString()));
    return randomAvatar.toString();
  };

  const arraysEqual = (arr1: Player[], arr2: Player[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => JSON.stringify(item) === JSON.stringify(arr2[index]));
  };

  const handleCancelGame = async () => {
    if (!gameData || !gameId) {
      toast.error("Cannot cancel game: missing game data");
      return;
    }

    try {
      await cancelGame(gameData.gameId);
      localStorage.removeItem("playerSession");
      localStorage.removeItem("gameId");
      navigate("/quizzes", { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to cancel game: ${errorMessage}`);
    }
  };

  const handleStartGame = async () => {
    if (!gameData || !gameId) {
      toast.error("Cannot start game: missing game data");
      return;
    }

    try {
      await startGame(gameData.gameId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to start game: ${errorMessage}`);
    }
  };

  const copyPinCode = async () => {
    if (!gameData) {
      toast.error("Cannot copy PIN code: missing game data");
      return;
    }

    try {
      await navigator.clipboard.writeText(gameData.pinCode);
      toast.success("PIN code copied successfully!");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = gameData.pinCode;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("PIN code copied successfully!");
      } catch (fallbackErr) {
        toast.error(`Failed to copy PIN code: ${gameData.pinCode}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const joinUrl = gameData?.pinCode ? `${window.location.origin}/join?pin=${gameData.pinCode}` : "";

  const memoizedPlayers = useMemo(() => players, [players]);

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="text-center p-4">
          <div
            className="spinner-border text-white mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white fs-5 fw-medium">Loading waiting room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100 w-100"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="card shadow-lg rounded-4 p-5 text-center w-100">
          <i className="bx bx-error-circle text-danger mb-3" style={{ fontSize: "4rem" }}></i>
          <h4 className="text-dark fw-bold mb-3">An error occurred</h4>
          <p className="text-muted mb-4">{error}</p>
          <div className="d-flex gap-3 justify-content-center">
            <button
              className="btn btn-primary rounded-pill px-4 py-2"
              onClick={() => navigate(-1)}
            >
              <i className="bx bx-refresh me-2"></i>
              Try Again
            </button>
            <button
              className="btn btn-outline-secondary rounded-pill px-4 py-2"
              onClick={() => navigate("/")}
            >
              <i className="bx bx-home me-2"></i>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="card shadow-lg rounded-4 p-5 text-center w-100">
          <i className="bx bx-info-circle text-warning mb-3" style={{ fontSize: "4rem" }}></i>
          <h4 className="text-dark fw-bold mb-3">Game not found</h4>
          <p className="text-muted mb-4">This game session could not be found.</p>
          <button
            className="btn btn-primary rounded-pill px-4 py-2"
            onClick={() => navigate("/")}
          >
            <i className="bx bx-home me-2"></i>
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-vh-100 py-4 w-100"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-11 col-xl-10">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Header */}
              <div
                className="position-relative"
                style={{
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  padding: "2rem 1rem",
                }}
              >
                <div className="text-center text-white">
                  <h1 className="mb-2 fw-bold" style={{ fontSize: "2.2rem" }}>
                    <i className="bx bx-game me-3"></i>
                    {quizTitle}
                  </h1>
                  <p className="mb-0 opacity-75" style={{ fontSize: "1.1rem" }}>
                    {isHost ? "🎮 Host Room" : "⏳ Waiting Room"}
                  </p>
                </div>
              </div>

              <div className="card-body p-4 p-md-5">
                {/* PIN Section */}
                <div className="row align-items-center mb-5">
                  <div className="col-lg-8">
                    <div className="text-center text-lg-start">
                      <h3 className="mb-3 fw-bold text-primary" style={{ fontSize: "1.8rem" }}>
                        <i className="bx bx-key me-2"></i>
                        Join PIN
                      </h3>

                      <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-lg-start gap-3 mb-3">
                        <div className="pin-display position-relative">
                          <div
                            className="bg-gradient-primary text-white py-3 px-5 rounded-3 shadow-lg"
                            style={{
                              background: "linear-gradient(45deg, #ff6b6b, #ee5a24)",
                              fontSize: "2.5rem",
                              fontWeight: "bold",
                              letterSpacing: "0.2em",
                              border: "3px solid rgba(255,255,255,0.3)",
                            }}
                          >
                            {gameData.pinCode}
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary rounded-circle p-2"
                            onClick={copyPinCode}
                            title="Copy PIN code"
                          >
                            <i className="bx bx-copy" style={{ fontSize: "1.3rem" }}></i>
                          </button>

                          {isHost && (
                            <button
                              className="btn btn-outline-info rounded-circle p-2"
                              onClick={() => setShowQR(!showQR)}
                              title="Show/Hide QR Code"
                            >
                              <i className="bx bx-qr" style={{ fontSize: "1.3rem" }}></i>
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-muted mb-0" style={{ fontSize: "1rem" }}>
                        {isHost
                          ? "📱 Share this PIN code with players to join the game"
                          : `✅ Joined game with PIN: ${gameData.pinCode}`}
                      </p>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="col-lg-4">
                    {isHost && (showQR || window.innerWidth >= 992) && (
                      <div className="text-center">
                        <QRCode value={joinUrl} size={120} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Players Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3
                      className="mb-0 fw-bold text-dark d-flex align-items-center"
                      style={{ fontSize: "1.8rem" }}
                    >
                      <i className="bx bx-group me-2 text-primary"></i>
                      Players ({memoizedPlayers.length})
                    </h3>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="pulse-dot bg-success rounded-circle"
                        style={{ width: "12px", height: "12px" }}
                      ></div>
                      <span className="badge bg-success-soft text-success py-2 px-3 rounded-pill fw-medium">
                        {isHost ? "🎯 Waiting for players..." : "⏱️ Waiting for host to start..."}
                      </span>
                    </div>
                  </div>

                  {memoizedPlayers.length === 0 ? (
                    <div
                      className="text-center py-5 rounded-3"
                      style={{
                        background: "linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)",
                        border: "2px dashed #2196f3",
                      }}
                    >
                      <i
                        className="bx bx-user-plus text-primary mb-3"
                        style={{ fontSize: "4rem" }}
                      ></i>
                      <h5 className="text-primary fw-bold mb-2">No players yet</h5>
                      <p className="text-muted mb-0">
                        Share the PIN code or QR code to invite friends to join!
                      </p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {memoizedPlayers.map((player, index) => {
                        const isCurrentUser = player.userId === user?.userId;
                        return (
                          <div key={player.playerId} className="col-md-6 col-lg-4">
                            <div
                              className={`card border-0 rounded-3 p-3 h-100 position-relative transition-all ${
                                isCurrentUser
                                  ? "bg-primary-soft border-primary shadow-lg transform-scale-105"
                                  : "bg-white shadow-sm hover-lift"
                              }`}
                              style={{
                                border: isCurrentUser ? "2px solid #4facfe" : "1px solid #e9ecef",
                                transform: isCurrentUser ? "scale(1.02)" : "scale(1)",
                                transition: "all 0.3s ease",
                              }}
                            >
                              {isCurrentUser && (
                                <div className="position-absolute top-0 end-0 translate-middle">
                                  <span className="badge bg-primary rounded-pill px-2 py-1">
                                    <i className="bx bx-user-check me-1"></i>
                                    You
                                  </span>
                                </div>
                              )}

                              <div className="d-flex align-items-center">
                                <div className="position-relative">
                                  <img
                                    src={player.avatar || unknownAvatar}
                                    alt={player.nickname}
                                    className={`rounded-circle border ${
                                      isCurrentUser ? "border-primary border-3" : "border-light border-2"
                                    }`}
                                    width={isCurrentUser ? "56" : "48"}
                                    height={isCurrentUser ? "56" : "48"}
                                    style={{ objectFit: "cover" }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (target.src !== unknownAvatar) {
                                        target.src = unknownAvatar;
                                      }
                                    }}
                                  />
                                  {isCurrentUser && (
                                    <div className="position-absolute bottom-0 end-0">
                                      <i
                                        className="bx bx-crown text-warning bg-white rounded-circle p-1"
                                        style={{ fontSize: "1rem" }}
                                      ></i>
                                    </div>
                                  )}
                                </div>

                                <div className="ms-3 flex-grow-1">
                                  <h5
                                    className={`mb-1 fw-bold ${isCurrentUser ? "text-primary" : "text-dark"}`}
                                    style={{
                                      fontSize: isCurrentUser ? "1.3rem" : "1.1rem",
                                    }}
                                  >
                                    {player.nickname}
                                    {isCurrentUser && (
                                      <i className="bx bx-star text-warning ms-2"></i>
                                    )}
                                  </h5>
                                  <div className="d-flex align-items-center gap-2">
                                    <small className="text-muted d-flex align-items-center">
                                      <i className="bx bx-time me-1"></i>
                                      {new Date(player.joinedAt).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </small>
                                    <span
                                      className="badge bg-success-soft text-success rounded-pill px-2 py-1"
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      #{index + 1}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isHost && (
                  <div
                    className="d-flex flex-column flex-sm-row justify-content-between gap-3 mt-5 p-4 rounded-3"
                    style={{
                      background: "linear-gradient(135deg, #f8f9ff 0%, #e8f5e8 100%)",
                    }}
                  >
                    <button
                      className="btn btn-outline-danger rounded-pill px-4 py-2 fw-medium"
                      onClick={handleCancelGame}
                      style={{ minWidth: "140px" }}
                    >
                      <i className="bx bx-x me-2"></i>
                      Cancel Game
                    </button>

                    <button
                      className="btn btn-success rounded-pill px-4 py-2 fw-medium position-relative"
                      onClick={handleStartGame}
                      disabled={memoizedPlayers.length === 0}
                      style={{ minWidth: "140px" }}
                    >
                      <i className="bx bx-play me-2"></i>
                      Start Game
                      {memoizedPlayers.length === 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge bg-warning text-dark rounded-pill">
                          Players Needed
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {!isHost && (
                  <div
                    className="text-center mt-4 p-4 rounded-3"
                    style={{
                      background: "linear-gradient(135deg, #fff3e0 0%, #e8f5e8 100%)",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <div className="spinner-grow spinner-grow-sm text-primary"></div>
                      <h5 className="mb-0 text-primary fw-bold">Waiting for host to start the game...</h5>
                    </div>
                    <p className="text-muted mb-0">Please be patient, the game will start soon! 🎮</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomSessionPage;