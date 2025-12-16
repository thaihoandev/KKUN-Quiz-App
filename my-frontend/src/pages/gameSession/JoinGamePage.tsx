// src/pages/JoinGamePage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  joinGameAuthenticated,
  joinGameAnonymous,
  getGameByPin,
} from "@/services/gameService";
import { setWebSocketGuestToken, setWebSocketToken } from "@/services/webSocketService";
import { handleApiError } from "@/utils/apiErrorHandler";
import type { GameResponseDTO } from "@/types/game";

const JoinGamePage = () => {
  const navigate = useNavigate();
  const { pinCode: routePinCode } = useParams();

  // State
  const [step, setStep] = useState<"enter-code" | "enter-nickname" | "loading">(
    routePinCode ? "enter-nickname" : "enter-code"
  );
  const [pinCode, setPinCode] = useState(routePinCode || "");
  const [nickname, setNickname] = useState("");
  const [gameInfo, setGameInfo] = useState<GameResponseDTO | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Current auth state
  const [isAuthenticated] = useState(
    !!localStorage.getItem("authToken") || !!localStorage.getItem("accessToken")
  );

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Load game info if PIN provided via route
  useEffect(() => {
    if (routePinCode && step === "enter-nickname" && !gameInfo) {
      validateAndFetchGame(routePinCode);
    }
  }, []);

  // Validate PIN and fetch game info
  const validateAndFetchGame = async (code: string) => {
    setError("");
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError("Please enter a room code");
      return false;
    }

    if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      setError("Room code must be exactly 6 digits");
      return false;
    }

    setIsLoading(true);

    try {
      const game = await getGameByPin(trimmedCode);
      if (!game || !game.gameId) {
        setError("Room code not found. Please check and try again.");
        return false;
      }

      setGameInfo(game);
      setPinCode(trimmedCode);
      setStep("enter-nickname");
      return true;
    } catch (err: any) {
      console.error("Failed to fetch game info:", err);
      setError(
        err.response?.data?.message ||
          "Room not found. Please check the code and try again."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterCode = async () => {
    await validateAndFetchGame(pinCode);
  };

  const handleKeyDownCode = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && pinCode.length === 6) {
      handleEnterCode();
    }
  };

  // Join game
  const handleJoinGame = async (anonymous: boolean) => {
    setError("");
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setError("Please enter a nickname");
      return;
    }

    if (trimmedNickname.length < 2) {
      setError("Nickname must be at least 2 characters");
      return;
    }

    if (trimmedNickname.length > 30) {
      setError("Nickname must be less than 30 characters");
      return;
    }

    setIsLoading(true);
    setStep("loading");

    try {
      const joinRequest = { nickname: trimmedNickname };

      let participant;
      if (anonymous) {
        participant = await joinGameAnonymous(pinCode, joinRequest);
        // Set guest token for anonymous users
        if (participant.guestToken) {
          localStorage.setItem("guestToken", participant.guestToken);
          setWebSocketGuestToken(participant.guestToken);
        }
      } else {
        participant = await joinGameAuthenticated(pinCode, joinRequest);
        // Set auth token for authenticated users
        const authToken = localStorage.getItem("authToken") || localStorage.getItem("accessToken");
        if (authToken) {
          setWebSocketToken(authToken);
        }
      }

      // Save participant session
      if (participant.participantId) {
        localStorage.setItem("participantId", participant.participantId);
        localStorage.setItem("isAnonymous", String(anonymous));
        localStorage.setItem("gameId", gameInfo?.gameId || "");
        localStorage.setItem("currentPinCode", pinCode);
      }

      console.log("✅ Successfully joined game", {
        participantId: participant.participantId,
        gameId: gameInfo?.gameId,
        isAnonymous: anonymous,
      });

      // Navigate to waiting room
      navigate(`/game-session/${gameInfo?.gameId}`, {
        state: {
          participantId: participant.participantId,
          pinCode: pinCode,
          nickname: trimmedNickname,
          isAnonymous: anonymous,
        },
        replace: true,
      });
    } catch (err: any) {
      console.error("Failed to join game:", err);
      handleApiError(err, "Không thể tham gia phòng");
      setError(
        err.response?.data?.message ||
          "Failed to join game. Please try again."
      );
      setStep("enter-nickname");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep("enter-code");
    setPinCode("");
    setNickname("");
    setGameInfo(null);
    setError("");
  };

  const handleKeyDownNickname = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && nickname.trim().length >= 2) {
      handleJoinGame(isAuthenticated ? false : true);
    }
  };

  // ==================== RENDER ====================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "var(--surface-color)",
          borderRadius: "20px",
          border: "2px solid var(--border-color)",
          padding: "3rem 2rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          animation: "slideInUp 0.4s ease forwards",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            <i className="bx bx-game"></i>
          </div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "var(--text-color)",
            }}
          >
            {step === "enter-code" ? "Join Game" : "Enter Your Name"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {step === "enter-code"
              ? "Enter the room code to join a quiz game"
              : `Joining as ${isAuthenticated ? "Authenticated User" : "Guest"}`}
          </p>
        </div>

        {/* Step 1: Enter Code */}
        {step === "enter-code" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.75rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text-color)",
                }}
              >
                Room Code
              </label>
              <input
                type="text"
                placeholder="000000"
                value={pinCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPinCode(value);
                }}
                onKeyDown={handleKeyDownCode}
                disabled={isLoading}
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  textAlign: "center",
                  letterSpacing: "8px",
                  borderRadius: "12px",
                  border: "2px solid var(--border-color)",
                  backgroundColor: "var(--surface-alt)",
                  color: "var(--text-color)",
                  transition: "all 0.25s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(96, 165, 250, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  borderRadius: "12px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderLeft: "4px solid var(--danger-color)",
                  color: "var(--danger-color)",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  animation: "slideInDown 0.3s ease",
                }}
              >
                <i className="bx bx-error-circle" style={{ fontSize: "1.2rem" }}></i>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleEnterCode}
              disabled={isLoading || pinCode.length !== 6}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: "12px",
                border: "none",
                background: pinCode.length === 6 ? "var(--gradient-primary)" : "var(--surface-alt)",
                color: pinCode.length === 6 ? "white" : "var(--text-muted)",
                cursor: pinCode.length === 6 && !isLoading ? "pointer" : "not-allowed",
                transition: "all 0.25s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (pinCode.length === 6 && !isLoading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(96, 165, 250, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <i className="bx bx-right-arrow-circle"></i>
                  Next
                </>
              )}
            </button>

            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              Get the code from the host or check the displayed QR code
            </p>
          </div>
        )}

        {/* Step 2: Enter Nickname */}
        {step === "enter-nickname" && gameInfo && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Game Info Card */}
            <div
              style={{
                marginBottom: "2rem",
                padding: "1.5rem",
                borderRadius: "12px",
                backgroundColor: "var(--surface-alt)",
                border: "1px solid var(--border-color)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "0.75rem",
                }}
              >
                Game Details
              </h3>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  marginBottom: "0.5rem",
                }}
              >
                {gameInfo.quizTitle}
              </p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                Host: <strong>{gameInfo.hostNickname}</strong>
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>
                  <i className="bx bx-group"></i> {gameInfo.playerCount}/{gameInfo.maxPlayers} Players
                </span>
                <span>
                  <i className="bx bx-book-open"></i> {gameInfo.totalQuestions} Questions
                </span>
              </div>
            </div>

            {/* Nickname Input */}
            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.75rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text-color)",
                }}
              >
                Your Nickname
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={handleKeyDownNickname}
                disabled={isLoading}
                maxLength={30}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "12px",
                  border: "2px solid var(--border-color)",
                  backgroundColor: "var(--surface-alt)",
                  color: "var(--text-color)",
                  transition: "all 0.25s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(96, 165, 250, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.5rem",
                }}
              >
                {nickname.length}/30 characters
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  borderRadius: "12px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderLeft: "4px solid var(--danger-color)",
                  color: "var(--danger-color)",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  animation: "slideInDown 0.3s ease",
                }}
              >
                <i className="bx bx-error-circle" style={{ fontSize: "1.2rem" }}></i>
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleGoBack}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  borderRadius: "12px",
                  border: "2px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-color)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.25s ease",
                  opacity: isLoading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = "var(--surface-alt)";
                    e.currentTarget.style.borderColor = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              >
                <i className="bx bx-left-arrow-circle"></i> Back
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => handleJoinGame(false)}
                  disabled={isLoading || nickname.trim().length < 2}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    borderRadius: "12px",
                    border: "none",
                    background:
                      nickname.trim().length >= 2 && !isLoading
                        ? "var(--gradient-primary)"
                        : "var(--surface-alt)",
                    color: nickname.trim().length >= 2 && !isLoading ? "white" : "var(--text-muted)",
                    cursor:
                      nickname.trim().length >= 2 && !isLoading ? "pointer" : "not-allowed",
                    transition: "all 0.25s ease",
                    opacity: isLoading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) => {
                    if (nickname.trim().length >= 2 && !isLoading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(96, 165, 250, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Joining...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-log-in-circle"></i>
                      Join
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleJoinGame(true)}
                  disabled={isLoading || nickname.trim().length < 2}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    borderRadius: "12px",
                    border: "none",
                    background:
                      nickname.trim().length >= 2 && !isLoading
                        ? "var(--gradient-primary)"
                        : "var(--surface-alt)",
                    color: nickname.trim().length >= 2 && !isLoading ? "white" : "var(--text-muted)",
                    cursor:
                      nickname.trim().length >= 2 && !isLoading ? "pointer" : "not-allowed",
                    transition: "all 0.25s ease",
                    opacity: isLoading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) => {
                    if (nickname.trim().length >= 2 && !isLoading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(96, 165, 250, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Joining...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-ghost"></i>
                      Join as Guest
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "1.5rem",
                animation: "spin 1s linear infinite",
              }}
            >
              <i className="bx bx-loader"></i>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
              Joining game...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default JoinGamePage;