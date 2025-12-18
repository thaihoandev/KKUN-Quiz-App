// src/pages/WaitingRoomSessionPage.tsx - ENHANCED WITH QR CODE

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode, { QRCodeCanvas, QRCodeSVG } from "qrcode.react"; // Thêm thư viện QR Code
import {
  startGame,
  cancelGame,
  leaveGame,
  kickParticipant,
  getParticipants,
  setupHostListeners,
  setupParticipantListeners,
  clearParticipantSession,
} from "@/services/gameService";
import { webSocketService } from "@/services/webSocketService";
import { useGameSessionValidator } from "@/hooks/useGameSessionValidator";
import { handleApiError } from "@/utils/apiErrorHandler";

const WaitingRoomSessionPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const {
    isValid,
    isValidating,
    error: validationError,
    gameInfo,
    participants: initialParticipants,
    participantId,
    pinCode,
  } = useGameSessionValidator(gameId);

  const [participants, setParticipants] = useState(initialParticipants);
  const [isHost, setIsHost] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isDark, setIsDark] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [actionError, setActionError] = useState("");

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const questionListenerRef = useRef<(() => void) | null>(null);

  // URL để người chơi tham gia (dùng cho QR Code)
  const joinUrl = pinCode ? `${window.location.origin}/join/${pinCode}` : "";

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

  // Sync participants from validator
  useEffect(() => {
    if (initialParticipants.length > 0) {
      setParticipants(initialParticipants);
    }
  }, [initialParticipants]);

  // Detect host
  useEffect(() => {
    if (gameInfo) {
      setIsHost(gameInfo.isHost || false);
    }
  }, [gameInfo]);

  // Load participants manually (backup)
  const loadParticipants = async () => {
    if (!gameId) return;
    try {
      const participantsList = await getParticipants(gameId);
      setParticipants(participantsList || []);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Failed to load participants:", err);
    }
  };

  // ==================== WEBSOCKET SETUP ====================
  useEffect(() => {
    if (!gameId || isValidating || !isValid || !gameInfo) {
      return;
    }

    console.log("🔌 [WAITING ROOM] Setting up WebSocket listeners...", {
      gameId,
      participantId,
      isHost,
    });

    webSocketService.subscribeToQuestions(gameId);

    questionListenerRef.current = webSocketService.onQuestion((question) => {
      console.log(
        "✅ [WAITING ROOM] First question received! Navigating to GamePlay...",
        question.questionNumber
      );

      navigate(`/game-play/${gameId}`, {
        replace: true,
        state: { initialQuestion: question },
      });
    });

    if (isHost) {
      unsubscribeRef.current = setupHostListeners(gameId, {
        onGameEvent: (event) => {
          if (
            ["PARTICIPANT_JOINED", "PARTICIPANT_LEFT", "PARTICIPANT_KICKED"].includes(
              event.eventType
            )
          ) {
            loadParticipants();
          }
        },
        onParticipants: (participantsList) => {
          setParticipants(participantsList || []);
          setLastUpdate(Date.now());
        },
        onConnectionChange: (connected) => {
          console.log("🔌 [HOST - WAITING] Connection:", connected);
        },
      });
        } else {
      unsubscribeRef.current = setupParticipantListeners(
        gameId,
        participantId!,
        {
          // === THÊM MỚI: Xử lý khi có người join/leave/kick ===
          onGameEvent: (event) => {
            if (
              ["PARTICIPANT_JOINED", "PARTICIPANT_LEFT", "PARTICIPANT_KICKED"].includes(
                event.eventType
              )
            ) {
              loadParticipants();
            }
          },
          // ====================================================

          onParticipants: (participantsList) => {
            setParticipants(participantsList || []);
            setLastUpdate(Date.now());
          },
          onKicked: () => {
            setActionError("Bạn đã bị host kick khỏi phòng");
            setTimeout(() => {
              localStorage.removeItem("participantId");
              localStorage.removeItem("isAnonymous");
              navigate("/", { replace: true });
            }, 3000);
          },
          onConnectionChange: (connected) => {
            console.log("🔌 [PARTICIPANT - WAITING] Connection:", connected);
          },
        }
      );
    }

    return () => {
      console.log("🧹 [WAITING ROOM] Cleaning up listeners");
      if (questionListenerRef.current) {
        questionListenerRef.current();
        questionListenerRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [gameId, participantId, isValidating, isValid, gameInfo, isHost, navigate]);

  // ==================== HOST ACTIONS ====================
  const handleStartGame = async () => {
    if (!gameId || isStarting || participants.length === 0) return;
    setIsStarting(true);
    setActionError("");

    try {
      await startGame(gameId);
      console.log("🎬 [HOST] Start game called - waiting for first question...");
    } catch (err: any) {
      handleApiError(err);
      setActionError("Không thể bắt đầu trò chơi. Vui lòng thử lại.");
      setIsStarting(false);
    }
  };

  const handleCancelGame = async () => {
    if (!gameId || isCancelling) return;
    if (!window.confirm("Bạn có chắc chắn muốn hủy trò chơi này?")) return;

    setIsCancelling(true);
    try {
      await cancelGame(gameId);
      localStorage.removeItem("participantId");
      localStorage.removeItem("isAnonymous");
      navigate("/", { replace: true });
    } catch (err: any) {
      handleApiError(err);
      setActionError("Không thể hủy trò chơi");
    } finally {
      setIsCancelling(false);
    }
  };

  // ==================== PARTICIPANT ACTIONS ====================
  const handleLeaveGame = async () => {
    if (!gameId || !participantId || isLeaving) return;
    if (!window.confirm("Bạn có chắc chắn muốn rời phòng chơi?")) return;

    setIsLeaving(true);
    try {
      await leaveGame(gameId, participantId);
      clearParticipantSession();
      navigate("/", { replace: true });
    } catch (err: any) {
      handleApiError(err);
      setActionError("Không thể rời phòng");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleKickPlayer = async (participantToKick: string, nickname: string) => {
    if (!gameId) return;
    if (!window.confirm(`Kick ${nickname} khỏi phòng?`)) return;

    try {
      await kickParticipant(gameId, participantToKick);
      await loadParticipants();
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pinCode || "");
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  // ==================== RENDER ====================
  if (isValidating) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "3rem", animation: "spin 1s linear infinite" }}>
          ⚙️
        </div>
        <p style={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: "1.1rem" }}>
          Đang xác thực phiên chơi...
        </p>
      </div>
    );
  }

  if (!isValid || validationError) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
          padding: "2rem",
        }}
      >
        <div
          style={{
            textAlign: "center",
            backgroundColor: isDark ? "#1e293b" : "#fff",
            padding: "3rem",
            borderRadius: "16px",
            boxShadow: isDark
              ? "0 20px 25px rgba(0,0,0,0.3)"
              : "0 20px 25px rgba(0,0,0,0.1)",
            maxWidth: "400px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
          <h2 style={{ color: isDark ? "#f1f5f9" : "#1e293b", marginBottom: "0.5rem" }}>
            Không thể tham gia phòng chơi
          </h2>
          <p style={{ color: isDark ? "#cbd5e1" : "#64748b" }}>
            {validationError || "Phiên chơi không hợp lệ"}
          </p>
        </div>
      </div>
    );
  }

  if (!gameInfo) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        }}
      >
        <h2 style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>Không tìm thấy trò chơi</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#f1f5f9" : "#1e293b",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Error Banner */}
      {actionError && (
        <div
          style={{
            backgroundColor: "#ef4444",
            color: "#fff",
            padding: "1rem",
            textAlign: "center",
            fontSize: "0.95rem",
            fontWeight: 500,
            animation: "slideDown 0.3s ease",
          }}
        >
          ⚠️ {actionError}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          backgroundColor: isDark ? "#1e293b" : "#fff",
          borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          padding: "2rem 1rem",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1
            style={{
              margin: "0 0 2rem 0",
              fontSize: "2.4rem",
              fontWeight: 800,
              textAlign: "center",
              color: isDark ? "#f1f5f9" : "#0f172a",
            }}
          >
            {gameInfo.quiz.title}
          </h1>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "2rem",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Host Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "2rem" }}>👑</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7 }}>Host</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem" }}>
                  {gameInfo.host.nickname || gameInfo.host.username}
                  {isHost && (
                    <span
                      style={{
                        marginLeft: "0.75rem",
                        backgroundColor: "#3b82f6",
                        color: "#fff",
                        padding: "0.3rem 0.9rem",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      YOU
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* PIN + QR Code Card */}
            <div
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                padding: "2rem",
                borderRadius: "20px",
                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                boxShadow: isDark
                  ? "0 10px 30px rgba(0,0,0,0.4)"
                  : "0 10px 30px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "2rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {/* QR Code */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#fff",
                    borderRadius: "16px",
                    display: "inline-block",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  <QRCodeSVG value={joinUrl} size={160} level="H" includeMargin />
                </div>
                <p
                  style={{
                    margin: "1rem 0 0 0",
                    fontSize: "0.95rem",
                    opacity: 0.85,
                    fontWeight: 500,
                  }}
                >
                  Quét QR để tham gia
                </p>
              </div>

              {/* PIN Code */}
              <div style={{ minWidth: "200px", textAlign: "center" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", opacity: 0.7 }}>
                  Mã phòng
                </p>
                <p
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    letterSpacing: "0.2em",
                    color: "#3b82f6",
                  }}
                >
                  {pinCode}
                </p>
                <button
                  onClick={copyToClipboard}
                  style={{
                    width: "100%",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    padding: "0.9rem",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                >
                  {showCopyFeedback ? "✓ Đã copy!" : "📋 Copy mã"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem 1rem",
          display: "grid",
          gridTemplateColumns: "1fr minmax(320px, 400px)",
          gap: "2rem",
        }}
        className="main-content-grid"
      >
        {/* Participants Section */}
        <div
          style={{
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderRadius: "20px",
            padding: "2rem",
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.3)"
              : "0 10px 30px rgba(0,0,0,0.08)",
            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "1.8rem" }}>👥</span>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
              Người chơi
              <span
                style={{
                  marginLeft: "0.75rem",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  padding: "0.4rem 1rem",
                  borderRadius: "16px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {participants.length}/{gameInfo.maxPlayers}
              </span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {participants.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: isDark ? "#94a3b8" : "#94a3b8" }}>
                <p style={{ fontSize: "3.5rem", margin: "0 0 1rem 0" }}>⏳</p>
                <p style={{ margin: 0, fontSize: "1.1rem" }}>Đang chờ người chơi tham gia...</p>
              </div>
            ) : (
              participants.map((p, idx) => (
                <div
                  key={p.participantId}
                  style={{
                    padding: "1.2rem",
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                    borderRadius: "16px",
                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "1.05rem" }}>
                        {p.nickname}
                      </p>
                      {p.isAnonymous && (
                        <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.8rem", opacity: 0.6 }}>
                          🔐 Anonymous
                        </p>
                      )}
                    </div>
                  </div>

                  {isHost && p.participantId !== participantId && (
                    <button
                      onClick={() => handleKickPlayer(p.participantId, p.nickname)}
                      style={{
                        padding: "0.6rem 1.2rem",
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ef4444")}
                    >
                      Kick
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Game Info Card */}
          <div
            style={{
              backgroundColor: isDark ? "#1e293b" : "#fff",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: isDark
                ? "0 10px 30px rgba(0,0,0,0.3)"
                : "0 10px 30px rgba(0,0,0,0.08)",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
            }}
          >
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", opacity: 0.7 }}>📊 Thông tin trò chơi</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.9rem", opacity: 0.7 }}>Số câu hỏi</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>
                  {gameInfo.totalQuestions} câu
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.9rem", opacity: 0.7 }}>Trạng thái</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#10b981" }}>●</span> Đang chờ bắt đầu
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isHost ? (
            <>
              <button
                onClick={handleStartGame}
                disabled={isStarting || participants.length === 0}
                style={{
                  width: "100%",
                  padding: "1.4rem",
                  backgroundColor: isStarting || participants.length === 0 ? "#94a3b8" : "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  cursor: isStarting || participants.length === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                }}
                onMouseOver={(e) =>
                  !isStarting && participants.length > 0 && (e.currentTarget.style.backgroundColor = "#059669")
                }
                onMouseOut={(e) =>
                  !isStarting && participants.length > 0 && (e.currentTarget.style.backgroundColor = "#10b981")
                }
              >
                {isStarting ? (
                  <>
                    <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                    Đang bắt đầu...
                  </>
                ) : (
                  <>🎮 Bắt đầu trò chơi</>
                )}
              </button>

              <button
                onClick={handleCancelGame}
                disabled={isCancelling}
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: isCancelling ? "not-allowed" : "pointer",
                  opacity: isCancelling ? 0.6 : 1,
                }}
                onMouseOver={(e) => !isCancelling && (e.currentTarget.style.backgroundColor = "#dc2626")}
                onMouseOut={(e) => !isCancelling && (e.currentTarget.style.backgroundColor = "#ef4444")}
              >
                {isCancelling ? "Đang hủy..." : "🚫 Hủy trò chơi"}
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  padding: "2rem",
                  borderRadius: "16px",
                  textAlign: "center",
                  border: "1px solid #93c5fd",
                }}
              >
                <p style={{ margin: "0 0 0.75rem 0", fontSize: "2rem" }}>⏳</p>
                <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                  Đang chờ host bắt đầu trò chơi...
                </p>
              </div>

              <button
                onClick={handleLeaveGame}
                disabled={isLeaving}
                style={{
                  width: "100%",
                  padding: "1.2rem",
                  backgroundColor: "#64748b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: isLeaving ? "not-allowed" : "pointer",
                  opacity: isLeaving ? 0.6 : 1,
                }}
                onMouseOver={(e) => !isLeaving && (e.currentTarget.style.backgroundColor = "#475569")}
                onMouseOut={(e) => !isLeaving && (e.currentTarget.style.backgroundColor = "#64748b")}
              >
                {isLeaving ? "Đang rời..." : "👋 Rời phòng chơi"}
              </button>
            </>
          )}
        </div>
      </div>

     
    </div>
  );
};

export default WaitingRoomSessionPage;