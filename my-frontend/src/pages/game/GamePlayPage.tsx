"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";
import { submitAnswer, fetchLeaderboard, fetchGameDetails } from "@/services/gameService";
import {
  GameResponseDTO,
  PlayerResponseDTO,
  QuestionResponseDTO,
  LeaderboardEntryDTO,
} from "@/interfaces";
import styles from "./GamePlayPage.module.css";
import { WifiOutlined, DisconnectOutlined } from "@ant-design/icons";
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

interface Option {
  optionId: string;
  optionText: string;
  correct: boolean;
  correctAnswer?: string; // For FILL_IN_THE_BLANK
}

interface ExtendedQuestionResponseDTO extends QuestionResponseDTO {
  imageUrl?: string;
  options: Option[];
}

interface ExtendedPlayerResponseDTO extends PlayerResponseDTO {
  avatar?: string;
}

const GamePlayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const WS_ENDPOINT = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";
  const { user } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState<ExtendedQuestionResponseDTO | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<ExtendedQuestionResponseDTO | null>(null);
  const [pendingLeaderboard, setPendingLeaderboard] = useState<ExtendedPlayerResponseDTO[] | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [fillInAnswer, setFillInAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<ExtendedPlayerResponseDTO[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [players, setPlayers] = useState<ExtendedPlayerResponseDTO[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [isShowingCorrectAnswer, setIsShowingCorrectAnswer] = useState<boolean>(false);
  const [usedAvatars, setUsedAvatars] = useState<Set<string>>(new Set());

  const playersRef = useRef<ExtendedPlayerResponseDTO[]>([]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const isHost = useMemo(() => {
    return user?.userId !== undefined && hostId !== null && user.userId === hostId;
  }, [user, hostId]);

  const assignRandomAvatar = (): string => {
    const availableAvatars = AVATAR_LIST.filter((avatar) => !usedAvatars.has(avatar.toString()));
    if (availableAvatars.length === 0) {
      setUsedAvatars(new Set());
      return (AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)] || unknownAvatar).toString();
    }
    const randomAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)] || unknownAvatar;
    setUsedAvatars((prev) => new Set(prev).add(randomAvatar.toString()));
    console.log("Assigned avatar:", randomAvatar); // Debug log
    return randomAvatar.toString();
  };

  useEffect(() => {
    if (!gameId) {
      setError("No game ID provided");
      toast.error("No game ID provided");
      return;
    }

    (async () => {
      try {
        const gameDetails = await fetchGameDetails(gameId);
        setHostId(gameDetails.game.hostId);
        setPlayers(
          gameDetails.players.map((p) => ({
            ...p,
            avatar: assignRandomAvatar(),
          }))
        );
        const initialLeaderboard = await fetchLeaderboard(gameId);
        setLeaderboard(
          initialLeaderboard.map((p) => ({
            ...p,
            avatar: assignRandomAvatar(),
          }))
        );
      } catch {
        toast.error("Failed to load game details");
      }
    })();

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => console.log("[STOMP]", msg),
    });

    client.onConnect = () => {
      setWsConnected(true);
      setError(null);

      if (!isHost) {
        client.subscribe(`/topic/game/${gameId}/question`, (msg) => {
          try {
            const question: ExtendedQuestionResponseDTO = JSON.parse(msg.body);
            console.log("Received question:", question); // Debug log
            if (isShowingCorrectAnswer) {
              setPendingQuestion(question);
              console.log("Queued pending question:", question); // Debug log
            } else {
              setCurrentQuestion(question);
              setImageUrl(question.imageUrl || "");
              setTimeLeft(question.timeLimit || 5);
              setSelectedOptionIds([]);
              setFillInAnswer("");
              setHasAnswered(false);
              setIsSubmitting(false);
              setShowCorrectAnswer(false);
            }
          } catch {
            toast.error("Failed to load question");
          }
        });
      }

      client.subscribe(`/topic/game/${gameId}/leaderboard`, (msg) => {
        try {
          const entries: LeaderboardEntryDTO[] = JSON.parse(msg.body);
          const updated = entries.map((e) => {
            const p = playersRef.current.find((pl) => pl.playerId === e.playerId);
            return {
              playerId: e.playerId,
              nickname: p?.nickname ?? "Unknown",
              gameId: e.gameId,
              score: e.totalScore,
              inGame: p?.inGame ?? true,
              isAnonymous: p?.isAnonymous ?? true,
              avatar: p?.avatar ?? assignRandomAvatar(),
            } as ExtendedPlayerResponseDTO;
          });
          console.log("Received leaderboard:", updated); // Debug log
          if (isShowingCorrectAnswer) {
            setPendingLeaderboard(updated);
            console.log("Queued pending leaderboard:", updated); // Debug log
          } else {
            setLeaderboard(updated);
            if (!isHost) {
              setCurrentQuestion(null);
              setPendingQuestion(null);
            }
          }
        } catch {
          toast.error("Failed to load leaderboard");
        }
      });

      client.subscribe(`/topic/game/${gameId}/status`, (msg) => {
        try {
          const status: GameResponseDTO = JSON.parse(msg.body);
          if (status.status === "COMPLETED" || status.status === "CANCELED") {
            setGameEnded(true);
            localStorage.removeItem("playerSession");
            localStorage.removeItem("gameId");
          }
        } catch {
          toast.error("Failed to process game status");
        }
      });

      client.subscribe(`/topic/game/${gameId}/correct-answer`, (msg) => {
        try {
          const payload = JSON.parse(msg.body) as {
            questionId: string;
            correctOptions: Option[];
          };
          console.log("Received correct answer:", payload); // Debug log
          if (currentQuestion?.questionId === payload.questionId) {
            setShowCorrectAnswer(true);
            setIsShowingCorrectAnswer(true);
            setTimeout(() => {
              setShowCorrectAnswer(false);
              setIsShowingCorrectAnswer(false);
              setCurrentQuestion(null);
              if (pendingQuestion) {
                setCurrentQuestion(pendingQuestion);
                setImageUrl(pendingQuestion.imageUrl || "");
                setTimeLeft(pendingQuestion.timeLimit || 5);
                setSelectedOptionIds([]);
                setFillInAnswer("");
                setHasAnswered(false);
                setIsSubmitting(false);
                setShowCorrectAnswer(false);
                setPendingQuestion(null);
                console.log("Loaded pending question:", pendingQuestion); // Debug log
              }
              if (pendingLeaderboard) {
                setLeaderboard(pendingLeaderboard);
                setPendingLeaderboard(null);
                console.log("Loaded pending leaderboard:", pendingLeaderboard); // Debug log
              }
            }, 2000);
          }
        } catch {
          toast.error("Failed to load correct answer");
        }
      });
    };

    client.onStompError = () => {
      setWsConnected(false);
      setError("Real-time connection error.");
      toast.error("Real-time connection error.");
    };
    client.onWebSocketError = () => {
      setWsConnected(false);
      setError("Failed to establish real-time connection.");
      toast.error("Failed to establish real-time connection.");
    };
    client.onDisconnect = () => {
      setWsConnected(false);
    };

    client.activate();
    setStompClient(client);

    return () => {
      if (client.active) client.deactivate();
      setWsConnected(false);
      setStompClient(null);
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameId || wsConnected) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchLeaderboard(gameId);
        setLeaderboard(
          data.map((p) => ({
            ...p,
            avatar: assignRandomAvatar(),
          }))
        );
      } catch {
        toast.error("Failed to fetch leaderboard");
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [gameId, wsConnected]);

  useEffect(() => {
    if (timeLeft > 0 && currentQuestion && !isHost) {
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer);
            setIsShowingCorrectAnswer(true);
            console.log("Time up, waiting for correct answer from WebSocket"); // Debug log
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, currentQuestion, isHost]);

  const handleMultipleChoiceSelect = async (optionId: string) => {
    if (hasAnswered || timeLeft === 0 || isHost) return;
    let newSelectedOptionIds: string[] = [];
    if (currentQuestion?.questionType === "MULTIPLE_CHOICE") {
      newSelectedOptionIds = selectedOptionIds.includes(optionId)
        ? selectedOptionIds.filter((id) => id !== optionId)
        : [...selectedOptionIds, optionId];
    } else {
      newSelectedOptionIds = [optionId];
    }
    setSelectedOptionIds(newSelectedOptionIds);

    // Auto-submit for MULTIPLE_CHOICE
    if (!gameId || !currentQuestion || newSelectedOptionIds.length === 0 || isSubmitting || hasAnswered) return;
    setIsSubmitting(true);
    try {
      const playerId = localStorage.getItem("playerSession");
      if (!playerId) throw new Error("Player session not found");
      const res = await submitAnswer(gameId, {
        playerId,
        questionId: currentQuestion.questionId,
        selectedOptionIds: newSelectedOptionIds,
        answerStr: "",
      });
      setHasAnswered(true);
      toast.success(res.message);
    } catch (err) {
      toast.error(`Failed to submit answer: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillInInput = (val: string) => {
    if (hasAnswered || timeLeft === 0 || isHost) return;
    setFillInAnswer(val);
  };

  const handleFillInSubmit = async () => {
    if (hasAnswered || timeLeft === 0 || isHost || !currentQuestion || !gameId || !fillInAnswer.trim()) return;
    setIsSubmitting(true);
    try {
      const playerId = localStorage.getItem("playerSession");
      if (!playerId) throw new Error("Player session not found");
      const res = await submitAnswer(gameId, {
        playerId,
        questionId: currentQuestion.questionId,
        selectedOptionIds: [],
        answerStr: fillInAnswer.trim(),
      });
      setHasAnswered(true);
      toast.success(res.message);
    } catch (err) {
      toast.error(`Failed to submit answer: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <i className="bx bx-trophy text-warning" style={{ fontSize: "1.5rem" }}></i>;
      case 1:
        return <i className="bx bx-medal text-gray-400" style={{ fontSize: "1.5rem" }}></i>;
      case 2:
        return <i className="bx bx-medal text-orange-600" style={{ fontSize: "1.5rem" }}></i>;
      default:
        return <span className="font-bold">#{index + 1}</span>;
    }
  };

  const getRankBackground = (index: number) => {
    switch (index) {
      case 0:
        return styles.rankGold;
      case 1:
        return styles.rankSilver;
      case 2:
        return styles.rankBronze;
      default:
        return styles.rankDefault;
    }
  };

  if (error) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${styles.errorContainer}`}>
        <div className="card shadow-lg rounded-4 p-5 text-center w-100" style={{ maxWidth: "400px" }}>
          <i className="bx bx-error-circle text-danger mb-3" style={{ fontSize: "4rem" }}></i>
          <h4 className="text-dark fw-bold mb-3">An Error Occurred</h4>
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

  if (gameEnded) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${styles.gameOverContainer}`}>
        <div className="card shadow-lg rounded-4 p-4 text-center w-100" style={{ maxWidth: "600px" }}>
          <div
            className="position-relative"
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              padding: "2rem 1rem",
              borderRadius: "15px 15px 0 0",
            }}
          >
            <h2 className="mb-0 text-white fw-bold">🎉 Game Complete! 🎉</h2>
            <p className="mb-0 text-white opacity-75">Final Leaderboard</p>
          </div>
          <div className="card-body p-4">
            {leaderboard.sort((a, b) => b.score - a.score).map((player, index) => (
              <div
                key={player.playerId}
                className={`card mb-2 ${getRankBackground(index)} text-white p-3 d-flex justify-content-between align-items-center ${styles.leaderboardItem}`}
              >
                <div className="d-flex align-items-center">
                  <img
                    src={player.avatar || unknownAvatar}
                    alt={player.nickname}
                    className="rounded-circle border border-light border-2 me-3"
                    width="48"
                    height="48"
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error("Failed to load avatar:", target.src);
                      if (target.src !== unknownAvatar) {
                        target.src = unknownAvatar;
                      }
                    }}
                  />
                  <span className="me-3">{getRankIcon(index)}</span>
                  <span className="fw-bold">{player.nickname}</span>
                </div>
                <span className="badge bg-light text-dark p-2">{player.score} pts</span>
              </div>
            ))}
          </div>
          <div className="card-footer p-3">
            <button
              className="btn btn-primary rounded-pill px-4 py-2 w-100"
              onClick={() => navigate("/")}
            >
              <i className="bx bx-home me-2"></i>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 py-4 w-100 ${styles.container}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-11 col-xl-10">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
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
                    Quiz Game
                  </h1>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="opacity-75" style={{ fontSize: "1.1rem" }}>
                      {isHost ? "🎯 Host View" : "👤 Player View"}
                    </span>
                    <span className={`badge ${wsConnected ? "bg-success" : "bg-danger"} py-2 px-3 rounded-pill`}>
                      {wsConnected ? <WifiOutlined /> : <DisconnectOutlined />}
                      {wsConnected ? " Connected" : " Offline"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body p-4 p-md-5">
                {isHost ? (
                  leaderboard.length > 0 ? (
                    <div>
                      <h3 className="mb-4 fw-bold text-dark d-flex align-items-center" style={{ fontSize: "1.8rem" }}>
                        <i className="bx bx-bar-chart-alt-2 me-2 text-primary"></i>
                        Live Leaderboard
                      </h3>
                      <div className="row g-3">
                        {leaderboard.sort((a, b) => b.score - a.score).map((player, index) => (
                          <div key={player.playerId} className="col-md-6 col-lg-4">
                            <div
                              className={`card border-0 rounded-3 p-3 h-100 ${getRankBackground(index)} text-white ${styles.leaderboardItem}`}
                            >
                              <div className="d-flex align-items-center">
                                <img
                                  src={player.avatar || unknownAvatar}
                                  alt={player.nickname}
                                  className="rounded-circle border border-light border-2 me-3"
                                  width="48"
                                  height="48"
                                  style={{ objectFit: "cover" }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    console.error("Failed to load avatar:", target.src);
                                    if (target.src !== unknownAvatar) {
                                      target.src = unknownAvatar;
                                    }
                                  }}
                                />
                                <span className="me-3">{getRankIcon(index)}</span>
                                <div>
                                  <h5 className="mb-1 fw-bold">{player.nickname}</h5>
                                  <span className="badge bg-light text-dark p-2">{player.score} pts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-center mt-4 text-muted">📡 Monitoring game progress...</p>
                    </div>
                  ) : (
                    <div
                      className="text-center py-5 rounded-3"
                      style={{
                        background: "linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)",
                        border: "2px dashed #2196f3",
                      }}
                    >
                      <i className="bx bx-bar-chart-alt-2 text-primary mb-3" style={{ fontSize: "4rem" }}></i>
                      <h5 className="text-primary fw-bold mb-2">No Leaderboard Data Yet</h5>
                      <p className="text-muted mb-0">Waiting for players to submit answers...</p>
                    </div>
                  )
                ) : (
                  <>
                    {currentQuestion ? (
                      <div>
                        {imageUrl && (
                          <div className="text-center mb-4">
                            <img
                              src={imageUrl}
                              alt="Question image"
                              className="rounded-3 shadow-sm"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "300px",
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error("Failed to load question image:", target.src);
                                target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <h3 className="text-center mb-3 fw-bold text-dark" style={{ fontSize: "1.8rem" }}>
                          {currentQuestion.questionText}
                        </h3>
                        <p className="text-center mb-4">
                          <strong>
                            <i className="bx bx-time me-2"></i>
                            Time left: {timeLeft} seconds
                          </strong>
                        </p>
                        <div className="progress mb-4">
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{ width: `${(timeLeft / (currentQuestion.timeLimit || 5)) * 100}%` }}
                            aria-valuenow={timeLeft}
                            aria-valuemin={0}
                            aria-valuemax={currentQuestion.timeLimit || 5}
                          ></div>
                        </div>
                        {currentQuestion.questionType === "FILL_IN_THE_BLANK" ? (
                          <div className="d-flex gap-3 align-items-center">
                            <input
                              type="text"
                              className={`form-control mb-3 rounded-pill px-4 py-2 ${
                                showCorrectAnswer && currentQuestion.options.some((opt) => opt.correctAnswer === fillInAnswer.trim())
                                  ? styles.correctInput
                                  : showCorrectAnswer && fillInAnswer.trim()
                                  ? styles.wrongInput
                                  : ""
                              }`}
                              value={fillInAnswer}
                              onChange={(e) => handleFillInInput(e.target.value)}
                              disabled={timeLeft === 0 || hasAnswered || isSubmitting}
                              placeholder="Type your answer here..."
                            />
                            <button
                              className="btn btn-primary rounded-pill px-4 py-2"
                              onClick={handleFillInSubmit}
                              disabled={timeLeft === 0 || hasAnswered || isSubmitting || !fillInAnswer.trim()}
                            >
                              Submit
                            </button>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {currentQuestion.options.map((opt) => (
                              <div key={opt.optionId} className="col-md-6">
                                <button
                                  className={`btn w-100 rounded-pill px-4 py-2 ${
                                    showCorrectAnswer
                                      ? opt.correct
                                        ? `${styles.correctAnswer} btn-success`
                                        : selectedOptionIds.includes(opt.optionId)
                                        ? `${styles.wrongAnswer} btn-danger`
                                        : "btn-outline-primary"
                                      : selectedOptionIds.includes(opt.optionId)
                                      ? "btn-primary"
                                      : "btn-outline-primary"
                                  }`}
                                  onClick={() => handleMultipleChoiceSelect(opt.optionId)}
                                  disabled={timeLeft === 0 || hasAnswered || isSubmitting}
                                >
                                  {opt.optionText}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : leaderboard.length > 0 ? (
                      <div>
                        <h3 className="mb-4 fw-bold text-dark d-flex align-items-center" style={{ fontSize: "1.8rem" }}>
                          <i className="bx bx-bar-chart-alt-2 me-2 text-primary"></i>
                          Current Standings
                        </h3>
                        <div className="row g-3">
                          {leaderboard.sort((a, b) => b.score - a.score).map((player, index) => (
                            <div key={player.playerId} className="col-md-6 col-lg-4">
                              <div
                                className={`card border-0 rounded-3 p-3 h-100 ${getRankBackground(index)} text-white ${styles.leaderboardItem}`}
                              >
                                <div className="d-flex align-items-center">
                                  <img
                                    src={player.avatar || unknownAvatar}
                                    alt={player.nickname}
                                    className="rounded-circle border border-light border-2 me-3"
                                    width="48"
                                    height="48"
                                    style={{ objectFit: "cover" }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      console.error("Failed to load avatar:", target.src);
                                      if (target.src !== unknownAvatar) {
                                        target.src = unknownAvatar;
                                      }
                                    }}
                                  />
                                  <span className="me-3">{getRankIcon(index)}</span>
                                  <div>
                                    <h5 className="mb-1 fw-bold">{player.nickname}</h5>
                                    <span className="badge bg-light text-dark p-2">{player.score} pts</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-center mt-4 text-muted">
                          <i className="bx bx-time me-2"></i>
                          Waiting for the next question...
                        </p>
                      </div>
                    ) : (
                      <div
                        className="text-center py-5 rounded-3"
                        style={{
                          background: "linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)",
                          border: "2px dashed #2196f3",
                        }}
                      >
                        <i className="bx bx-hourglass text-primary mb-3" style={{ fontSize: "4rem" }}></i>
                        <h5 className="text-primary fw-bold mb-2">Waiting for the First Question</h5>
                        <p className="text-muted mb-0">Get ready, the game will start soon!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlayPage;