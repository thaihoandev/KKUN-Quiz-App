// src/pages/WaitingRoomSessionPage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getGameDetails,
  getParticipants,
  startGame,
  cancelGame,
  getSavedParticipantId,
  clearParticipantSession,
  setupHostListeners,
  setupGameEventListeners,
  setupParticipantListeners,
} from "@/services/gameService";
import type { GameDetailDTO, GameParticipantDTO, GameEventPayload } from "@/types/game";

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

const AVATAR_POOL = [
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

// ==================== QR CODE COMPONENT ====================

interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode: React.FC<QRCodeProps> = ({ value, size = 140 }) => {
  const url = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(value)}`;
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="bg-white p-3 rounded-3 shadow-sm border">
        <img
          src={url}
          alt="QR Code"
          width={size}
          height={size}
          className="img-fluid"
        />
      </div>
      <small className="text-white-50 mt-2">Scan to join</small>
    </div>
  );
};

// ==================== HOST INFO COMPONENT ====================

interface HostInfoCardProps {
  host: {
    userId: string;
    username: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

const HostInfoCard: React.FC<HostInfoCardProps> = ({ host }) => {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-gradient" style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div className="d-flex align-items-center text-white">
        <img
          src={host.avatarUrl || unknownAvatar}
          alt={host.nickname || host.username}
          className="rounded-circle me-3 flex-shrink-0 border border-3 border-white"
          width={80}
          height={80}
          style={{ objectFit: 'cover' }}
        />
        <div className="flex-grow-1">
          <div className="badge bg-warning text-dark mb-2">
            <i className="bx bx-crown me-1"></i>
            Host
          </div>
          <h4 className="mb-1 fw-bold">{host.nickname || host.username}</h4>
          <p className="mb-0 opacity-75">@{host.username}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== PARTICIPANT AVATAR COMPONENT ====================

interface ParticipantCardProps {
  participant: GameParticipantDTO & { avatar?: string };
  isYou: boolean;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isYou,
}) => {
  return (
    <div className="col-md-6 col-lg-4">
      <div
        className={`card h-100 border-0 shadow-sm rounded-4 p-3 position-relative ${
          isYou ? "border-primary border-3 bg-primary-subtle" : ""
        }`}
      >
        {isYou && (
          <div className="position-absolute top-0 end-0 translate-middle-x">
            <span className="badge bg-primary rounded-pill">You</span>
          </div>
        )}
        <div className="d-flex align-items-center">
          <img
            src={participant.avatar || unknownAvatar}
            alt={participant.nickname}
            className="rounded-circle me-3 flex-shrink-0"
            width={56}
            height={56}
            style={{ objectFit: 'cover' }}
          />
          <div className="flex-grow-1 min-w-0">
            <h6 className="mb-0 fw-bold text-truncate">
              {participant.nickname}
            </h6>
            <small className="text-muted">
              {isYou ? "Your player" : "Joined"}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const WaitingRoomSessionPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameDetailDTO | null>(null);
  const [participants, setParticipants] = useState<
    (GameParticipantDTO & { avatar?: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // ✅ Determine role - Check if currentParticipant is null (means user is host)
  const isHost = useMemo(() => {
    if (!game) return false;
    // If currentParticipant is null, user is the host
    return game.currentParticipant === null;
  }, [game]);

  // ✅ Get host information from game.host
  const hostInfo = useMemo(() => game?.host, [game]);
  
  const participantId = useMemo(() => getSavedParticipantId(), []);

  // ==================== LOAD INITIAL DATA ====================

  useEffect(() => {
    if (!gameId) {
      setError("Game ID not found");
      setIsLoading(false);
      return;
    }

    const loadGameData = async () => {
      try {
        console.log("Loading game details for:", gameId);
        const gameData = await getGameDetails(gameId);

        if (!gameData) {
          throw new Error("Failed to load game");
        }

        setGame(gameData);
        console.log("✅ Game loaded:", {
          gameId: gameData.gameId,
          status: gameData.gameStatus,
          playerCount: gameData.playerCount,
          isHost: gameData.currentParticipant === null,
          hostInfo: gameData.host
        });

        // Check game status - redirect if necessary
        if (gameData.gameStatus === "IN_PROGRESS") {
          console.log("Game already started, redirecting to gameplay...");
          navigate(`/game-play/${gameId}`, { replace: true });
          return;
        }

        if (["FINISHED", "CANCELLED"].includes(gameData.gameStatus)) {
          console.log("Game already ended");
          clearParticipantSession();
          toast.info("Game session has ended");
          navigate("/", { replace: true });
          return;
        }

        // ✅ FIXED: Only non-host players need to have participantId
        // Host doesn't join as participant, so no participantId
        const isUserHost = gameData.currentParticipant === null;
        if (!isUserHost && !participantId) {
          console.log("Non-host player without participantId, redirecting to join...");
          navigate(`/join-game/${gameData.pinCode}`, { replace: true });
          return;
        }

        // Load participants
        const participantsData = await getParticipants(gameId);
        setParticipantsWithAvatars(participantsData);

        setIsLoading(false);
      } catch (err: any) {
        console.error("Failed to load game:", err);
        setError(err.message || "Failed to load game room");
        setIsLoading(false);
      }
    };

    loadGameData();
  }, [gameId, navigate, participantId]);

  // ==================== WEBSOCKET - REAL-TIME UPDATES ====================

  useEffect(() => {
    if (!gameId || !game) return;

    let cleanupFunctions: Array<() => void> = [];

    const handleGameEvent = (event: GameEventPayload) => {
      console.log("Game event received:", event.eventType);

      switch (event.eventType) {
        case "PARTICIPANT_JOINED": {
          console.log("Participant joined");
          if (event.data && event.data.playerCount !== undefined) {
            setGame((prev) =>
              prev
                ? { ...prev, playerCount: event.data!.playerCount }
                : null
            );
          }
          loadParticipantsList();
          break;
        }

        case "PARTICIPANT_LEFT": {
          console.log("Participant left");
          if (event.data && event.data.playerCount !== undefined) {
            setGame((prev) =>
              prev
                ? { ...prev, playerCount: event.data!.playerCount }
                : null
            );
          }
          loadParticipantsList();
          break;
        }

        case "PARTICIPANT_KICKED": {
          console.log("Participant kicked");
          if (event.data && event.data.participantId === participantId) {
            toast.error(
              event.data.reason || "You have been kicked from the game"
            );
            clearParticipantSession();
            navigate("/", { replace: true });
          } else {
            loadParticipantsList();
          }
          break;
        }

        case "GAME_STARTING": {
          setIsStarting(true);
          toast.info("Game starting in 3 seconds...", { autoClose: 3000 });
          break;
        }

        case "GAME_STARTED": {
          console.log("Game started, redirecting to gameplay...");
          navigate(`/game-play/${gameId}`, { replace: true });
          break;
        }

        case "GAME_ENDED":
        case "GAME_CANCELLED": {
          console.log("Game ended or cancelled");
          clearParticipantSession();
          toast.info("Game session has ended");
          navigate("/", { replace: true });
          break;
        }

        default:
          console.debug("Unhandled event:", event.eventType);
      }
    };

    // Setup listeners based on role
    if (isHost) {
      cleanupFunctions.push(
        setupHostListeners(gameId, {
          onGameEvent: handleGameEvent,
          onConnectionChange: (connected) => {
            if (!connected) {
              toast.warning("Connection lost");
            }
          },
        })
      );
    } else {
      cleanupFunctions.push(
        setupGameEventListeners(gameId, {
          onGameEvent: handleGameEvent,
        })
      );

      if (participantId) {
        cleanupFunctions.push(
          setupParticipantListeners(gameId, participantId, {
            onKicked: (notification) => {
              toast.error(notification.reason || "You have been kicked");
              clearParticipantSession();
              navigate("/", { replace: true });
            },
            onConnectionChange: (connected) => {
              if (!connected) {
                toast.warning("Connection lost");
              }
            },
          })
        );
      }
    }

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [gameId, game, isHost, participantId, navigate]);

  // ==================== HELPER FUNCTIONS ====================

  const loadParticipantsList = async () => {
    try {
      if (!gameId) return;
      const data = await getParticipants(gameId);
      setParticipantsWithAvatars(data);
    } catch (err) {
      console.error("Failed to load participants:", err);
    }
  };

  const setParticipantsWithAvatars = (data: GameParticipantDTO[]) => {
    const used = new Set<string>();
    const withAvatars = data.map((p) => {
      let avatar = unknownAvatar;

      if (p.isAnonymous) {
        const available = AVATAR_POOL.filter((a) => !used.has(a));
        avatar =
          available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : unknownAvatar;
        used.add(avatar);
      }

      return { ...p, avatar };
    });

    setParticipants(withAvatars);
  };

  // ==================== HOST ACTIONS ====================

  const handleStartGame = async () => {
    if (!gameId || !game || isStarting) return;

    setIsStarting(true);
    try {
      console.log("Host starting game...");
      await startGame(gameId);
      toast.success("Game started!");
    } catch (err: any) {
      console.error("Failed to start game:", err);
      toast.error(err.message || "Failed to start game");
      setIsStarting(false);
    }
  };

  const handleCancelGame = async () => {
    if (!gameId || !game) return;

    if (!window.confirm("Are you sure you want to cancel this game?")) {
      return;
    }

    try {
      console.log("Host cancelling game...");
      await cancelGame(gameId);
      clearParticipantSession();
      toast.success("Game cancelled");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Failed to cancel game:", err);
      toast.error(err.message || "Failed to cancel game");
    }
  };

  const copyPin = async () => {
    if (!game?.pinCode) return;
    try {
      await navigator.clipboard.writeText(game.pinCode);
      toast.success("Room code copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const joinUrl = game?.pinCode
    ? `${window.location.origin}/join-game/${game.pinCode}`
    : "";

  // ==================== RENDER ====================

  // Loading state
  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary">
        <div className="text-center text-white">
          <div
            className="spinner-border mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4>Loading game room...</h4>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !game) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary">
        <div className="card shadow-lg p-5 text-center" style={{ maxWidth: 500 }}>
          <i
            className="bx bx-error-circle text-danger mb-3"
            style={{ fontSize: "4rem" }}
          ></i>
          <h4>Error</h4>
          <p className="text-muted">{error || "Game room not found"}</p>
          <button
            className="btn btn-light mt-3"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div
      className="min-vh-100"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="container py-4 py-md-5">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Header */}
              <div
                className="text-white text-center py-5"
                style={{
                  background:
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                }}
              >
                <h1 className="display-5 fw-bold mb-2">
                  {game.quiz.title || "Quiz Game"}
                </h1>
                <p className="lead mb-0">
                  {isHost ? "Host Waiting Room" : "Waiting for host to start..."}
                </p>
              </div>

              <div className="card-body p-4 p-md-5">
                {/* ✅ HOST INFO - Show for both host and players */}
                {hostInfo && (
                  <HostInfoCard host={hostInfo} />
                )}

                {/* PIN + QR Section */}
                <div className="row align-items-center mb-5">
                  <div className="col-lg-8">
                    <h3 className="fw-bold text-primary mb-3">Room Code</h3>
                    <div className="d-flex align-items-center gap-4 flex-wrap">
                      <div
                        className="py-3 px-5 rounded-4 text-white fw-bold shadow-lg"
                        style={{
                          background:
                            "linear-gradient(45deg, #ff6b6b, #ee5a24)",
                          fontSize: "2.8rem",
                          letterSpacing: "0.2em",
                        }}
                      >
                        {game.pinCode}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-light rounded-circle shadow-sm"
                          onClick={copyPin}
                          title="Copy room code"
                        >
                          <i className="bx bx-copy"></i>
                        </button>
                        {isHost && (
                          <button
                            className="btn btn-light rounded-circle shadow-sm"
                            onClick={() => setShowQR((v) => !v)}
                            title="Show QR code"
                          >
                            <i className="bx bx-qr"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-muted mt-3">
                      {isHost
                        ? "Share this code with friends to join!"
                        : `You joined with code ${game.pinCode}`}
                    </p>
                  </div>
                  <div className="col-lg-4 text-center">
                    {isHost && (showQR || window.innerWidth >= 992) && (
                      <QRCode value={joinUrl} />
                    )}
                  </div>
                </div>

                {/* ✅ Game Settings Info */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0 bg-light rounded-4 p-3">
                      <div className="row g-3 text-center">
                        <div className="col-6 col-md-3">
                          <div className="d-flex flex-column">
                            <i className="bx bx-question-mark display-6 text-primary"></i>
                            <strong className="fs-5">{game.totalQuestions}</strong>
                            <small className="text-muted">Questions</small>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="d-flex flex-column">
                            <i className="bx bx-group display-6 text-success"></i>
                            <strong className="fs-5">{game.playerCount}/{game.maxPlayers}</strong>
                            <small className="text-muted">Players</small>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="d-flex flex-column">
                            <i className={`bx ${game.allowAnonymous ? 'bx-check-circle' : 'bx-x-circle'} display-6 text-info`}></i>
                            <strong className="fs-5">{game.allowAnonymous ? 'Yes' : 'No'}</strong>
                            <small className="text-muted">Anonymous</small>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="d-flex flex-column">
                            <i className={`bx ${game.showLeaderboard ? 'bx-trophy' : 'bx-hide'} display-6 text-warning`}></i>
                            <strong className="fs-5">{game.showLeaderboard ? 'On' : 'Off'}</strong>
                            <small className="text-muted">Leaderboard</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold">
                      Players ({participants.length})
                    </h3>
                    <span className="badge bg-success fs-6 px-3 py-2">
                      {isHost ? "Waiting..." : "Ready"}
                    </span>
                  </div>

                  {participants.length === 0 ? (
                    <div className="text-center py-5 bg-light rounded-4">
                      <i className="bx bx-user-plus display-1 text-primary mb-3"></i>
                      <h5>No players yet</h5>
                      <p className="text-muted">
                        Share the room code to invite players!
                      </p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {participants.map((p) => {
                        const isYou = p.participantId === participantId;
                        return (
                          <ParticipantCard
                            key={p.participantId}
                            participant={p}
                            isYou={isYou}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isHost ? (
                  // Host controls
                  <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center p-4 bg-light rounded-4">
                    <button
                      className="btn btn-danger btn-lg rounded-pill px-5"
                      onClick={handleCancelGame}
                      disabled={isStarting}
                      title="Cancel and close this game"
                    >
                      <i className="bx bx-x me-2"></i>
                      Cancel Game
                    </button>
                    <button
                      className="btn btn-success btn-lg rounded-pill px-5 fw-bold"
                      onClick={handleStartGame}
                      disabled={participants.length === 0 || isStarting}
                      title={
                        participants.length === 0
                          ? "Need at least 1 player"
                          : "Start the game"
                      }
                    >
                      {isStarting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Starting...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-play-circle me-2"></i>
                          Start Game ({participants.length}{" "}
                          {participants.length === 1 ? "player" : "players"})
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Player waiting state
                  <div className="text-center p-5 bg-light rounded-4">
                    <div
                      className="spinner-grow text-primary mb-3"
                      role="status"
                    >
                      <span className="visually-hidden">Waiting...</span>
                    </div>
                    <h5 className="text-primary">Waiting for host to start...</h5>
                    <p className="text-muted">
                      {participants.length} player
                      {participants.length !== 1 ? "s" : ""} ready • Share
                      the room code to invite more friends!
                    </p>
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