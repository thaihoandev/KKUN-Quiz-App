// src/components/JoinRoomBox/JoinRoomBox.tsx
import { getGameByPin } from "@/services/gameService";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ==================== HOOK ====================

function useJoinRoomLogic() {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasExistingSession = !!localStorage.getItem("participantId");

  /**
   * Validate PIN code and navigate to join game page
   */
  const openJoinPage = async () => {
    const code = roomCode.trim();

    // Clear previous errors
    setError("");

    if (!code) {
      setError("Please enter a room code");
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Room code must be exactly 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      // Verify room exists by fetching game info
      const gameInfo = await getGameByPin(code);

      if (!gameInfo || !gameInfo.gameId) {
        setError("Room code not found. Please check and try again.");
        return;
      }

      // Clear old session if exists
      localStorage.removeItem("participantId");
      localStorage.removeItem("guestToken");
      localStorage.removeItem("isAnonymous");

      // Store PIN for next page
      localStorage.setItem("currentPinCode", code);

      // Navigate to join-game page with PIN param
      navigate(`/join-game/${code}`);
    } catch (err: any) {
      console.error("Failed to validate room:", err);
      setError(
        err.response?.data?.message ||
          "Room not found. Please check the code and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      openJoinPage();
    }
  };

  return {
    roomCode,
    setRoomCode,
    error,
    setError,
    isLoading,
    hasExistingSession,
    openJoinPage,
    handleKeyDown,
  };
}

// ==================== COMPONENT ====================

interface BaseJoinRoomProps {
  layout: "sidebar" | "hero";
}

const BaseJoinRoom: React.FC<BaseJoinRoomProps> = ({ layout }) => {
  const {
    roomCode,
    setRoomCode,
    error,
    isLoading,
    hasExistingSession,
    openJoinPage,
    handleKeyDown,
  } = useJoinRoomLogic();

  const [isDark, setIsDark] = useState(false);

  // Detect dark mode changes
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

  // Common styles
  const commonInputStyles = {
    borderRadius: "12px",
    borderColor: "var(--border-color)",
    backgroundColor: "var(--surface-color)",
    color: "var(--text-color)",
    fontSize: "1rem",
    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
  };

  const commonButtonStyles = {
    borderRadius: "12px",
    fontWeight: 600,
    letterSpacing: "0.5px",
    transition:
      "background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease",
  };

  // Hero layout
  if (layout === "hero") {
    return (
      <div
        className="d-flex align-items-center justify-content-center gap-3 mt-4 flex-wrap"
        style={{
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <input
          id="roomCode"
          type="text"
          placeholder="Enter room code (6 digits)"
          className="form-control form-control-lg"
          aria-label="Room code"
          value={roomCode}
          onChange={(e) => {
            // Only allow digits, max 6
            const value = e.target.value.replace(/\D/g, "").slice(0, 6);
            setRoomCode(value);
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          maxLength={6}
          style={{
            ...commonInputStyles,
            flex: "1 1 auto",
            minWidth: "200px",
            padding: "0.875rem 1.25rem",
            fontSize: "1rem",
            textAlign: "center",
            letterSpacing: "4px",
            fontWeight: 500,
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          aria-label="Join room"
          disabled={isLoading || hasExistingSession || roomCode.length !== 6}
          title={
            hasExistingSession
              ? "You are already in a session"
              : roomCode.length !== 6
                ? "Please enter 6 digits"
                : "Join room"
          }
          onClick={openJoinPage}
          style={{
            ...commonButtonStyles,
            padding: "0.875rem 1.75rem",
            fontSize: "1rem",
            minWidth: "120px",
            whiteSpace: "nowrap",
          }}
        >
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              style={{ marginRight: "0.5rem" }}
            />
          ) : (
            <>
              <i
                className="bx bx-right-arrow-circle"
                style={{ marginRight: "0.35rem" }}
              />
              Join
            </>
          )}
        </button>

        {error && (
          <div
            className="alert alert-danger"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              marginTop: "1rem",
              marginBottom: 0,
              borderLeft: "4px solid var(--danger-color)",
              backgroundColor: "var(--surface-alt)",
              color: "var(--danger-color)",
              fontSize: "0.9rem",
              borderRadius: "12px",
              animation: "slideInUp 0.3s ease forwards",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="bx bx-error-circle" style={{ fontSize: "1.1rem" }} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Sidebar layout
  return (
    <div className="px-4 py-3">
      <div className="form-group">
        <label htmlFor="roomCode" className="form-label fw-semibold mb-2">
          Room Code
        </label>
        <div className="input-group">
          <input
            id="roomCode"
            type="text"
            className="form-control form-control-sm"
            placeholder="123456"
            value={roomCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setRoomCode(value);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={6}
            style={{
              ...commonInputStyles,
              padding: "0.5rem 0.875rem",
              fontSize: "0.9rem",
              textAlign: "center",
              letterSpacing: "2px",
              fontWeight: 500,
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={
              isLoading || hasExistingSession || roomCode.length !== 6
            }
            onClick={openJoinPage}
            title={
              hasExistingSession
                ? "You are already in a session"
                : roomCode.length !== 6
                  ? "Please enter 6 digits"
                  : "Join"
            }
            style={{
              ...commonButtonStyles,
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
            }}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <>
                <i className="bx bx-log-in-circle"></i>
              </>
            )}
          </button>
        </div>

        {/* Help text */}
        {!error && (
          <div className="form-text mt-2">
            Enter 6-digit room code
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="alert alert-danger"
            style={{
              padding: "0.75rem 1rem",
              marginTop: "0.75rem",
              marginBottom: 0,
              borderLeft: "4px solid var(--danger-color)",
              backgroundColor: "var(--surface-alt)",
              color: "var(--danger-color)",
              fontSize: "0.85rem",
              borderRadius: "12px",
              animation: "slideInUp 0.3s ease forwards",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="bx bx-error-circle" style={{ fontSize: "0.95rem" }} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== EXPORTS ====================

export const JoinRoomBox: React.FC = () => <BaseJoinRoom layout="sidebar" />;
export const JoinRoomHero: React.FC = () => <BaseJoinRoom layout="hero" />;
export default JoinRoomBox;