// src/pages/game/GamePlayPage.tsx - FIXED VERSION
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  nextQuestion,
  endGame,
  getGameDetails,
  submitAnswer,
  skipQuestion,
  sendHeartbeat,
  requestLeaderboard,
  requestGameDetails,
  requestGameStatistics,
  setupHostListeners,
  setupParticipantListeners,
} from "@/services/gameService";
import { webSocketService } from "@/services/webSocketService";
import { handleApiError } from "@/utils/apiErrorHandler";
import type {
  GameDetailDTO,
  GameParticipantDTO,
  QuestionResponseDTO,
  QuestionUpdateDTO,
  LeaderboardEntryDTO,
  GameEvent,
  GameStatisticsDTO,
} from "@/types/game";
import OptionsRenderer from "@/components/layouts/question/OptionsRenderer";

interface GamePlayState {
  isHost: boolean;
  gameInfo: GameDetailDTO | null;
  gameDetails: GameDetailDTO | null;
  gameStatistics: GameStatisticsDTO | null;
  currentQuestion: QuestionResponseDTO | null;
  participants: GameParticipantDTO[];
  leaderboard: LeaderboardEntryDTO[];
  answerResult: any | null;
  participantId: string | null;
  isKicked: boolean;
  isDisconnected: boolean;
  isGameEnded: boolean;
  gameEndReason: string | null;
}

const GamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const participantId = useRef(localStorage.getItem("participantId"));
  const isAnonymous = useRef(localStorage.getItem("isAnonymous") === "true");

  const [state, setState] = useState<GamePlayState>({
    isHost: false,
    gameInfo: null,
    gameDetails: null,
    gameStatistics: null,
    currentQuestion: null,
    participants: [],
    leaderboard: [],
    answerResult: null,
    participantId: participantId.current,
    isKicked: false,
    isDisconnected: false,
    isGameEnded: false,
    gameEndReason: null,
  });
  
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [hostNextLoading, setHostNextLoading] = useState(false);
  const [hostEndLoading, setHostEndLoading] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isCatchUp, setIsCatchUp] = useState(false);
  const location = useLocation();
  const initialQuestionFromState =
    location.state?.initialQuestion as QuestionUpdateDTO | null;

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Load game data
  useEffect(() => {
    if (!gameId || !participantId.current) {
      console.error("❌ Missing gameId or participantId");
      return;
    }

    const loadGameData = async () => {
      try {
        console.log("📥 Loading game data...");
        const gameInfo = await getGameDetails(gameId);

        setState((prev) => ({
          ...prev,
          gameInfo,
          isHost: gameInfo.isHost || false,
        }));

        console.log("✅ Game data loaded");

        if (participantId.current) {
          try {
            requestGameStatistics(gameId, participantId.current);
          } catch (err) {
            console.warn("⚠️ Failed to request game statistics:", err);
          }
        }
      } catch (err) {
        console.error("❌ Failed to load game data:", err);
        handleApiError(err);
      }
    };

    loadGameData();
  }, [gameId]);

  // Setup host listeners
  useEffect(() => {
    if (
      !state.isHost ||
      !gameId ||
      !participantId.current ||
      !state.gameInfo
    ) {
      return;
    }

    console.log("🔌 [HOST] Setting up WebSocket listeners...");

    unsubscribeRef.current = setupHostListeners(gameId, {
      onGameEvent: (event: GameEvent) => {
        console.log("🎮 [HOST] Game event:", event.eventType);
        if (event.eventType === "GAME_ENDED") {
          setState((prev) => ({ ...prev, isGameEnded: true }));
          setTimeout(() => {
            navigate(`/game-results/${gameId}`);
          }, 3000);
        }
      },

      onQuestion: (questionUpdate: QuestionUpdateDTO) => {
        console.log("❓ [HOST] New question:", questionUpdate.questionNumber);
        setSelectedAnswer(null);
        setIsSubmittingAnswer(false);
        setIsAnswering(true);
        setTimeRemaining(questionUpdate.timeLimitSeconds);
        setState((prev) => ({
          ...prev,
          currentQuestion: questionUpdate.question,
          answerResult: null,
        }));
        setIsCatchUp(false);
      },

      onParticipants: (participants: GameParticipantDTO[]) => {
        console.log("👥 [HOST] Participants updated:", participants?.length || 0);
        setState((prev) => ({ ...prev, participants: participants || [] }));
      },

      onLeaderboard: (leaderboard: LeaderboardEntryDTO[]) => {
        console.log("🏆 [HOST] Leaderboard updated");
        setState((prev) => ({ ...prev, leaderboard: leaderboard || [] }));
      },

      onGameDetails: (details: GameDetailDTO) => {
        console.log("ℹ️ [HOST] Game details updated");
        setState((prev) => ({ ...prev, gameDetails: details }));
      },

      onGameStatistics: (stats: GameStatisticsDTO) => {
        console.log("📈 [HOST] Game statistics updated");
        setState((prev) => ({ ...prev, gameStatistics: stats }));
      },

      onConnectionChange: (connected: boolean) => {
        console.log("🔌 Connection:", connected ? "CONNECTED" : "DISCONNECTED");
        setState((prev) => ({ ...prev, isDisconnected: !connected }));

        if (connected && gameId && participantId.current) {
          requestGameDetails(gameId, participantId.current);
          requestGameStatistics(gameId, participantId.current);
          requestLeaderboard(gameId, participantId.current);
          webSocketService.requestCurrentQuestion(gameId, participantId.current);
        }
      },
    });

    return () => {
      if (unsubscribeRef.current) {
        console.log("🧹 [HOST] Cleaning up listeners");
        unsubscribeRef.current();
      }
    };
  }, [state.isHost, gameId, state.gameInfo]);

  // Setup participant listeners
  useEffect(() => {
    if (state.isHost || !gameId || !participantId.current || !state.gameInfo) {
      return;
    }

    console.log("🔌 [PARTICIPANT] Setting up WebSocket listeners...");

    unsubscribeRef.current = setupParticipantListeners(
      gameId,
      participantId.current,
      {
        onQuestion: (question: QuestionUpdateDTO) => {
          console.log("❓ [PARTICIPANT] Question received");
          setTimeRemaining(question.timeLimitSeconds || 0);
          setState((prev) => ({
            ...prev,
            currentQuestion: question.question,
            answerResult: null,
          }));
          setIsAnswering(true);
          setSelectedAnswer(null);
          setIsSubmittingAnswer(false);
          setIsCatchUp(question.catchUp || false);
        },

        onLeaderboard: (leaderboard: LeaderboardEntryDTO[]) => {
          console.log("✅ leaderboard result received:", leaderboard);
          setState((prev) => ({ ...prev, leaderboard: leaderboard || [] }));
        },

        onParticipants: (participants: GameParticipantDTO[]) => {
          setState((prev) => ({ ...prev, participants: participants || [] }));
        },

        onAnswerResult: (result) => {
          setState((prev) => ({ ...prev, answerResult: result }));
          setIsSubmittingAnswer(false);
          setIsAnswering(false); // Stop showing answer options
        },

        onGameDetails: (details: GameDetailDTO) => {
          setState((prev) => ({ ...prev, gameDetails: details }));
        },

        onGameStatistics: (stats: GameStatisticsDTO) => {
          setState((prev) => ({ ...prev, gameStatistics: stats }));
        },

        onKicked: (notification) => {
          console.warn("🚫 [PARTICIPANT] Kicked");
          setState((prev) => ({ ...prev, isKicked: true }));
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 3000);
        },

        onConnectionChange: (connected: boolean) => {
          setState((prev) => ({ ...prev, isDisconnected: !connected }));

          if (connected && gameId && participantId.current) {
            requestGameDetails(gameId, participantId.current);
            requestGameStatistics(gameId, participantId.current);
            requestLeaderboard(gameId, participantId.current);
            webSocketService.requestCurrentQuestion(gameId, participantId.current);
          }
        },
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        console.log("🧹 [PARTICIPANT] Cleaning up listeners");
        unsubscribeRef.current();
      }
    };
  }, [state.isHost, gameId, state.gameInfo]);

  // Heartbeat
  useEffect(() => {
    if (state.isHost || !gameId || !participantId.current) return;

    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(gameId, participantId.current!);
    }, 30000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [gameId, state.isHost]);

  // Timer
  useEffect(() => {
    if (!isAnswering || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsAnswering(false);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswering, timeRemaining]);

  // Initial question from navigate state
  useEffect(() => {
    if (initialQuestionFromState && state.gameInfo) {
      console.log("🎯 Using initial question from state");
      setState((prev) => ({
        ...prev,
        currentQuestion: initialQuestionFromState.question,
      }));
      setTimeRemaining(initialQuestionFromState.timeLimitSeconds || 30);
      setIsAnswering(true);
      setSelectedAnswer(null);
      setIsCatchUp(false);
    }
  }, [initialQuestionFromState, state.gameInfo]);

  // Request current question on load
  useEffect(() => {
    if (gameId && participantId.current && state.gameInfo) {
      console.log("🔄 Requesting current question");
      webSocketService.requestCurrentQuestion(gameId, participantId.current);
    }
  }, [gameId, participantId.current, state.gameInfo]);

  // Handlers

  const handleSubmitAnswer = async () => {
    if (!gameId || !participantId.current || !state.currentQuestion) return;

    setIsSubmittingAnswer(true);
    try {
      submitAnswer(gameId, participantId.current, selectedAnswer);
      console.log("✅ Answer submitted");
    } catch (err) {
      console.error("❌ Failed to submit:", err);
      handleApiError(err);
      setIsSubmittingAnswer(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!gameId || !participantId.current) return;

    setIsSubmittingAnswer(true);
    try {
      skipQuestion(gameId, participantId.current);
      setIsAnswering(false);
      setSelectedAnswer(null);
    } catch (err) {
      console.error("❌ Failed to skip:", err);
      handleApiError(err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!gameId || !state.isHost) return;

    setHostNextLoading(true);
    try {
      await nextQuestion(gameId);
      console.log("✅ Next question loaded");
    } catch (err) {
      console.error("❌ Failed:", err);
      handleApiError(err);
    } finally {
      setHostNextLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!gameId || !state.isHost) return;

    const confirmed = window.confirm("Kết thúc game?");
    if (!confirmed) return;

    setHostEndLoading(true);
    try {
      await endGame(gameId);
      setState((prev) => ({ ...prev, isGameEnded: true }));
      setTimeout(() => {
        navigate(`/game-results/${gameId}`);
      }, 2000);
    } catch (err) {
      console.error("❌ Failed:", err);
      handleApiError(err);
    } finally {
      setHostEndLoading(false);
    }
  };

  // Helpers

  const getTimerColor = (): string => {
    if (timeRemaining > 10) return "#22c55e";
    if (timeRemaining > 5) return "#f59e0b";
    return "#ef4444";
  };

  const getTimerPercent = (): number => {
    const total = state.currentQuestion?.timeLimitSeconds || 30;
    return (timeRemaining / total) * 100;
  };

  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty) {
      case "EASY":
        return "Dễ";
      case "MEDIUM":
        return "Trung bình";
      case "HARD":
        return "Khó";
      default:
        return difficulty;
    }
  };

  // Render

  if (!state.gameInfo) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
          color: isDark ? "#fff" : "#000",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "1rem",
              animation: "spin 1s linear infinite",
            }}
          >
            ⚙️
          </div>
          <p>Đang tải trò chơi...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state.isKicked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
          color: isDark ? "#fff" : "#000",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
          <h2>Bạn đã bị kick khỏi trò chơi</h2>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: isDark ? "#1a1a1a" : "#fff",
        color: isDark ? "#fff" : "#000",
        minHeight: "100vh",
        padding: "1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {state.isDisconnected && (
        <div
          style={{
            backgroundColor: "#ef4444",
            color: "#fff",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          ⚠️ Kết nối bị mất - Đang kết nối lại...
        </div>
      )}

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 350px",
          gap: "2rem",
        }}
      >
        {/* MAIN CONTENT */}
        <div>
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "2rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: "0.75rem",
                }}
              >
                {state.gameInfo.quiz.title}
              </h1>

              {/* Question progress and participant count */}
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  ❓ Câu hỏi <strong>{(state.gameInfo.currentQuestionIndex || 0) + 1}</strong> /{" "}
                  <strong>{state.gameInfo.totalQuestions}</strong>
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  👥 <strong>{state.participants.length + 1}</strong> người chơi
                </p>
              </div>
            </div>

            {/* Host buttons */}
            {state.isHost && (
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={handleNextQuestion}
                  disabled={hostNextLoading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: hostNextLoading ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    opacity: hostNextLoading ? 0.6 : 1,
                  }}
                >
                  {hostNextLoading ? "Đang chuyển..." : "Câu tiếp theo ➡️"}
                </button>
                <button
                  onClick={handleEndGame}
                  disabled={hostEndLoading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: hostEndLoading ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    opacity: hostEndLoading ? 0.6 : 1,
                  }}
                >
                  {hostEndLoading ? "Đang kết thúc..." : "Kết thúc 🏁"}
                </button>
              </div>
            )}
          </div>

          {/* QUESTION CONTENT */}
          {state.currentQuestion ? (
            <div>
              {/* Timer */}
              {!state.isHost && isAnswering && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                    borderRadius: "12px",
                    marginBottom: "2rem",
                    border: isDark ? "1px solid #404040" : "1px solid #e5e5e5",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: getTimerColor(),
                        minWidth: "80px",
                        textAlign: "center",
                      }}
                    >
                      {timeRemaining}s
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: "8px",
                        backgroundColor: isDark ? "#1a1a1a" : "#e5e5e5",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          backgroundColor: getTimerColor(),
                          width: `${getTimerPercent()}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Question Box */}
              <div
                style={{
                  padding: "2rem",
                  backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                  borderRadius: "12px",
                  marginBottom: "2rem",
                  border: isDark ? "1px solid #404040" : "1px solid #e5e5e5",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 600,
                    margin: "0 0 1rem 0",
                    lineHeight: 1.5,
                  }}
                >
                  {state.currentQuestion.questionText}
                </h2>

                {state.currentQuestion.imageUrl && (
                  <img
                    src={state.currentQuestion.imageUrl}
                    alt="Question"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                    }}
                  />
                )}

                {/* Question Metadata */}
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                    paddingTop: "1rem",
                    borderTop: `1px solid ${isDark ? "#404040" : "#e5e5e5"}`,
                    marginTop: "1rem",
                  }}
                >
                  {state.currentQuestion.difficulty && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>📊</span>
                      <span style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                        Độ khó:{" "}
                        <strong>
                          {getDifficultyLabel(state.currentQuestion.difficulty)}
                        </strong>
                      </span>
                    </div>
                  )}

                  {state.currentQuestion.timeLimitSeconds && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>⏱️</span>
                      <span style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                        <strong>{state.currentQuestion.timeLimitSeconds}s</strong> để trả lời
                      </span>
                    </div>
                  )}

                  {state.currentQuestion.type && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>🎯</span>
                      <span style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                        <strong>{state.currentQuestion.type}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Hint */}
                {state.currentQuestion.hint && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      backgroundColor: isDark ? "#2a2a1a" : "#fffbeb",
                      borderLeft: "4px solid #f59e0b",
                      borderRadius: "4px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: isDark ? "#fbbf24" : "#d97706",
                      }}
                    >
                      💡 Gợi ý
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color: isDark ? "#fcd34d" : "#92400e",
                      }}
                    >
                      {state.currentQuestion.hint}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {state.currentQuestion.tags &&
                  state.currentQuestion.tags.length > 0 && (
                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {state.currentQuestion.tags.map((tag: string) => (
                        <span
                          key={tag}
                          style={{
                            backgroundColor: "#3b82f6",
                            color: "#fff",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
              </div>

              {/* Answer Result - Show FIRST if exists */}
              {state.answerResult && !state.isHost && (
                <AnswerResultRenderer result={state.answerResult} isDark={isDark} />
              )}

              {/* Answer Options - Only show if no result yet */}
              {!state.answerResult && isAnswering && !state.isHost && (
                <div style={{ marginBottom: "2rem" }}>
                  <OptionsRenderer
                    question={state.currentQuestion}
                    selectedAnswer={selectedAnswer}
                    onSelectAnswer={setSelectedAnswer}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginTop: "2rem",
                    }}
                  >
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={
                        !selectedAnswer ||
                        isSubmittingAnswer
                      }
                      style={{
                        flex: 1,
                        padding: "1rem",
                        backgroundColor: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: (!selectedAnswer || isSubmittingAnswer) ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        fontSize: "1rem",
                        opacity: (!selectedAnswer || isSubmittingAnswer) ? 0.5 : 1,
                      }}
                    >
                      {isSubmittingAnswer ? "Đang gửi..." : "Gửi câu trả lời ✓"}
                    </button>
                    <button
                      onClick={handleSkipQuestion}
                      disabled={isSubmittingAnswer}
                      style={{
                        padding: "1rem 2rem",
                        backgroundColor: isDark ? "#404040" : "#e5e7eb",
                        color: isDark ? "#fff" : "#000",
                        border: "none",
                        borderRadius: "8px",
                        cursor: isSubmittingAnswer ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        opacity: isSubmittingAnswer ? 0.5 : 1,
                      }}
                    >
                      Bỏ qua ⏭️
                    </button>
                  </div>
                </div>
              )}

              {/* Host Stats */}
              {state.isHost && (
                <div
                  style={{
                    padding: "2rem",
                    backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                    borderRadius: "12px",
                    border: isDark ? "1px solid #404040" : "1px solid #e5e5e5",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
                    👥 Trạng thái người chơi
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {/* Total */}
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderRadius: "8px",
                        border: isDark ? "1px solid #404040" : "1px solid #e5e5e5",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
                        👥
                      </p>
                      <p
                        style={{
                          margin: "0 0 0.25rem 0",
                          fontSize: "0.8rem",
                          color: isDark ? "#9ca3af" : "#6b7280",
                        }}
                      >
                        Tổng cộng
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          color: "#3b82f6",
                        }}
                      >
                        {state.participants.length + 1}
                      </p>
                    </div>

                    {/* Answered */}
                    {state.gameStatistics && (
                      <>
                        <div
                          style={{
                            padding: "1rem",
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderRadius: "8px",
                            border: isDark ? "1px solid #404040" : "1px solid #e5e5e5",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
                            ✅
                          </p>
                          <p
                            style={{
                              margin: "0 0 0.25rem 0",
                              fontSize: "0.8rem",
                              color: isDark ? "#9ca3af" : "#6b7280",
                            }}
                          >
                            Đã trả lời
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "1.5rem",
                              fontWeight: 700,
                              color: "#22c55e",
                            }}
                          >
                            {state.gameStatistics.completedPlayers || 0}
                          </p>
                        </div>

                        {/* Correct */}
                        <div
                          style={{
                            padding: "1rem",
                            backgroundColor: isDark ? "#1a1a1a" : "#fff",
                            borderRadius: "8px",
                            border: isDark ? "1px solid #404040" : "1px solid #e5e5e5",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
                            🎯
                          </p>
                          <p
                            style={{
                              margin: "0 0 0.25rem 0",
                              fontSize: "0.8rem",
                              color: isDark ? "#9ca3af" : "#6b7280",
                            }}
                          >
                            Đúng
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "1.5rem",
                              fontWeight: 700,
                              color: "#3b82f6",
                            }}
                          >
                            {state.gameStatistics.correctAnswers || 0}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                Chờ câu hỏi tiếp theo...
              </p>
            </div>
          )}
        </div>

        {/* SIDEBAR - LEADERBOARD */}
        <div>
          <div
            style={{
              backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
              borderRadius: "12px",
              padding: "1.5rem",
              maxHeight: "600px",
              overflowY: "auto",
              border: isDark ? "1px solid #404040" : "1px solid #e5e5e5",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
              🏆 Bảng xếp hạng
            </h3>

            {state.leaderboard && state.leaderboard.length > 0 ? (
              <div>
                {state.leaderboard.slice(0, 10).map((entry, idx) => (
                  <div
                    key={entry.participantId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0.75rem",
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderRadius: "8px",
                      marginBottom: "0.5rem",
                      borderLeft: `4px solid ${
                        idx === 0
                          ? "#fbbf24"
                          : idx === 1
                          ? "#9ca3af"
                          : idx === 2
                          ? "#d4a574"
                          : "transparent"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        minWidth: "30px",
                        fontSize: "0.9rem",
                      }}
                    >
                      {entry.rank}
                    </div>
                    <div style={{ flex: 1, marginLeft: "0.5rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {entry.nickname}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: isDark ? "#9ca3af" : "#6b7280",
                        }}
                      >
                        {entry.correctCount} đúng
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#3b82f6",
                        fontSize: "1rem",
                      }}
                    >
                      {entry.score}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  color: isDark ? "#9ca3af" : "#6b7280",
                  textAlign: "center",
                }}
              >
                Chưa có dữ liệu
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Answer Result Component
interface AnswerResultRendererProps {
  result: any;
  isDark: boolean;
}

const AnswerResultRenderer: React.FC<AnswerResultRendererProps> = ({
  result,
  isDark,
}) => {
  return (
    <div
      style={{
        padding: "2rem",
        borderRadius: "12px",
        backgroundColor: result.correct
          ? "rgba(34, 197, 94, 0.15)"
          : "rgba(239, 68, 68, 0.15)",
        border: `2px solid ${
          result.correct ? "#22c55e" : "#ef4444"
        }`,
        textAlign: "center",
        marginBottom: "2rem",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
        {result.correct ? "✅ Đúng!" : "❌ Sai"}
      </div>
      <p
        style={{
          color: isDark ? "#fff" : "#000",
          fontWeight: 600,
          marginBottom: "0.5rem",
          fontSize: "1.2rem",
        }}
      >
        +{result.pointsEarned || 0} điểm
      </p>

      {result.correctAnswer && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: isDark ? "#1a1a1a" : "#f0fdf4",
            borderRadius: "8px",
            marginTop: "1rem",
            marginBottom: "1rem",
            textAlign: "left",
            borderLeft: "4px solid #22c55e",
          }}
        >
          <p
            style={{
              color: isDark ? "#9ca3af" : "#6b7280",
              fontSize: "0.85rem",
              margin: "0 0 0.5rem 0",
            }}
          >
            💡 Đáp án đúng:
          </p>
          <p
            style={{
              color: "#22c55e",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {result.correctAnswer}
          </p>
        </div>
      )}

      {result.explanation && (
        <p
          style={{
            color: isDark ? "#9ca3af" : "#6b7280",
            fontSize: "0.9rem",
            marginTop: "1rem",
            lineHeight: 1.5,
          }}
        >
          <strong>📚 Giải thích:</strong> {result.explanation}
        </p>
      )}
    </div>
  );
};

export default GamePlayPage;