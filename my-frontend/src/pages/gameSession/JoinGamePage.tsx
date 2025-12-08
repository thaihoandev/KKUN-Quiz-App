// src/pages/JoinGamePage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  joinGameAuthenticated,
  joinGameAnonymous,
  getSavedParticipantId,
  saveParticipantSession,
  clearParticipantSession,
} from "@/services/gameService";
import { useAuthStore } from "@/store/authStore";
import { webSocketService } from "@/services/webSocketService";

// ==================== HOOK ====================

function useJoinGameLogic() {
  const { pinCode: pinFromParam } = useParams<{ pinCode?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pinCode, setPinCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Get PIN from URL or localStorage
  useEffect(() => {
    const pinFromQuery = searchParams.get("pin") || "";
    const pinFromStorage = localStorage.getItem("currentPinCode") || "";
    const finalPin = pinFromParam || pinFromQuery || pinFromStorage || "";

    if (finalPin) {
      setPinCode(finalPin);
    }
  }, [pinFromParam, searchParams]);

  // Restore saved nickname
  useEffect(() => {
    const saved = localStorage.getItem("nickname") || "";
    if (saved) {
      setNickname(saved);
    }
  }, []);

  // Check for existing session - redirect if already in a game
  useEffect(() => {
    const savedParticipantId = getSavedParticipantId();
    const savedGameId = localStorage.getItem("currentGameId");

    if (savedParticipantId && savedGameId) {
      console.log("Existing session detected, redirecting to game...", savedGameId);
      navigate(`/game-session/${savedGameId}`, { replace: true });
    }
  }, [navigate]);

  /**
   * Join game - Player only (not host)
   * Host creates game via QuizSubCard → goes directly to WaitingRoomSessionPage
   */
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPin = pinCode.trim();
    const trimmedNickname = nickname.trim();

    // Validation
    if (!trimmedPin) {
      setError("Please enter a room code");
      return;
    }

    if (trimmedPin.length !== 6) {
      setError("Room code must be exactly 6 digits");
      return;
    }

    if (!trimmedNickname) {
      setError("Please enter a nickname");
      return;
    }

    if (trimmedNickname.length > 20) {
      setError("Nickname must be 20 characters or less");
      return;
    }

    setIsJoining(true);

    try {
      const token = useAuthStore.getState().accessToken;
      let participant;

      // Join as authenticated user or anonymous
      if (token) {
        console.log("Joining as authenticated player...");
        participant = await joinGameAuthenticated(trimmedPin, {
          nickname: trimmedNickname,
        });
      } else {
        console.log("Joining as anonymous player...");
        participant = await joinGameAnonymous(trimmedPin, {
          nickname: trimmedNickname,
        });
      }

      // CRITICAL: Validate response
      if (
        !participant ||
        !participant.participantId ||
        !participant.gameId
      ) {
        console.error("Invalid participant response:", participant);
        throw new Error("Invalid server response. Please try again.");
      }

      // Save session
      saveParticipantSession(participant.participantId, participant.isAnonymous);
      localStorage.setItem("currentGameId", participant.gameId);
      localStorage.setItem("currentPinCode", trimmedPin);
      localStorage.setItem("nickname", participant.nickname || trimmedNickname);

      console.log("Successfully joined game:", {
        gameId: participant.gameId,
        participantId: participant.participantId,
        isHost: false,
        isAnonymous: participant.isAnonymous,
      });

      // Setup WebSocket connection
      webSocketService.joinGameRoom(participant.gameId);

      toast.success(`Joined game! Room: ${trimmedPin}`);

      // Navigate to waiting room as PLAYER (not host)
      navigate(`/game-session/${participant.gameId}`, {
        replace: true,
        state: {
          participantId: participant.participantId,
          gameId: participant.gameId,
          nickname: participant.nickname || trimmedNickname,
          pinCode: trimmedPin,
          isHost: false, // ← IMPORTANT: Player is NOT host
          isAnonymous: participant.isAnonymous,
          joinedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error("Failed to join game:", err);

      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to join room. Please check the code and try again.";

      setError(errorMsg);
      toast.error(errorMsg);

      // Clear invalid session
      clearParticipantSession();
      localStorage.removeItem("currentGameId");
    } finally {
      setIsJoining(false);
    }
  };

  return {
    pinCode,
    setPinCode,
    nickname,
    setNickname,
    error,
    setError,
    isJoining,
    handleJoinGame,
  };
}

// ==================== COMPONENT ====================

/**
 * JoinGamePage - For PLAYERS to join an existing game
 *
 * Flow:
 * 1. Player gets room code (from PIN or QR)
 * 2. Player enters nickname
 * 3. Player joins game as PARTICIPANT (not host)
 * 4. Redirected to WaitingRoomSessionPage (player view)
 *
 * Note: Host does NOT use this page
 * Host flow: QuizSubCard → createGame → WaitingRoomSessionPage (host view)
 */
const JoinGamePage: React.FC = () => {
  const {
    pinCode,
    setPinCode,
    nickname,
    setNickname,
    error,
    isJoining,
    handleJoinGame,
  } = useJoinGameLogic();

  const navigate = useNavigate();

  const showPinInput = !pinCode;

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="w-100" style={{ maxWidth: 520 }}>
        {/* Card */}
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="text-center text-white py-5"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <h1 className="display-5 fw-bold mb-2">
              <i className="bx bx-joystick-alt me-3"></i>
              KKun Quiz
            </h1>
            <p className="lead mb-0 opacity-90">
              {showPinInput
                ? "Enter room code to join a game"
                : "Choose your nickname and join!"}
            </p>
          </div>

          {/* Body */}
          <div className="card-body p-4 p-md-5">
            <form
              onSubmit={handleJoinGame}
              className="needs-validation"
              noValidate
            >
              {/* PIN Code Input - only show if not provided */}
              {showPinInput && (
                <div className="mb-4">
                  <label htmlFor="pinCode" className="form-label fw-semibold">
                    <i className="bx bx-key me-2"></i>
                    Room Code
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center rounded-4"
                    id="pinCode"
                    placeholder="123456"
                    value={pinCode}
                    onChange={(e) => {
                      // Only allow digits, max 6
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setPinCode(value);
                    }}
                    inputMode="numeric"
                    maxLength={6}
                    required
                    disabled={isJoining}
                    style={{
                      fontSize: "2rem",
                      letterSpacing: "8px",
                      fontWeight: 600,
                    }}
                  />
                  <div className="form-text text-center mt-2">
                    <i className="bx bx-info-circle me-1"></i>
                    Ask your friend or scan the QR code to get the room code
                  </div>
                </div>
              )}

              {/* Nickname Input */}
              <div className="mb-4">
                <label htmlFor="nickname" className="form-label fw-semibold">
                  <i className="bx bx-user me-2"></i>
                  Your Nickname
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-4"
                  id="nickname"
                  placeholder="E.g. ProGamer123"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  maxLength={20}
                  required
                  disabled={isJoining}
                />
                <div className="form-text">
                  {nickname.length}/20 characters. We'll remember it next time!
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  className="alert alert-danger d-flex align-items-center rounded-4 mb-4"
                  role="alert"
                >
                  <i className="bx bx-error-circle fs-5 me-2 flex-shrink-0"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Buttons */}
              <div className="d-grid gap-3">
                {/* Join Button */}
                <button
                  type="submit"
                  className="btn btn-lg rounded-4 text-white fw-bold"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "1rem",
                    fontSize: "1.1rem",
                    opacity: isJoining || nickname.length === 0 ? 0.7 : 1,
                  }}
                  disabled={isJoining || nickname.length === 0}
                  title={
                    nickname.length === 0
                      ? "Please enter a nickname"
                      : "Join the game room"
                  }
                >
                  {isJoining ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Joining room...
                    </>
                  ) : (
                    <>
                      <i
                        className="bx bx-log-in-circle me-2"
                        style={{ fontSize: "1.4rem" }}
                      ></i>
                      Join Game
                    </>
                  )}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  className="btn btn-lg btn-outline-secondary rounded-4 fw-bold"
                  onClick={() => navigate("/")}
                  disabled={isJoining}
                  title="Go back to home"
                >
                  <i className="bx bx-home me-2"></i>
                  Back to Home
                </button>
              </div>
            </form>
          </div>

          {/* Footer hint */}
          {!showPinInput && (
            <div className="bg-light px-4 py-3 text-center border-top">
              <small className="text-muted d-flex align-items-center justify-content-center gap-2">
                <i className="bx bx-check-shield"></i>
                Joining room <strong>{pinCode}</strong> as a player
              </small>
            </div>
          )}
        </div>

        {/* Bottom tip */}
        <div className="text-center text-white mt-4 opacity-75">
          <small>
            <i className="bx bx-bulb me-1"></i>
            Tip: Keep your nickname to remember your score!
          </small>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePage;