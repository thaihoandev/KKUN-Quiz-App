// ...imports giữ nguyên
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// -------------------------------
function useJoinRoomLogic() {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasExistingSession = !!localStorage.getItem("playerSession");

  const openJoinPage = () => {
    const code = roomCode.trim();
    if (!code) {
      setError("Please enter a room code");
      return;
    }
    // Điều hướng sang trang join-game để nhập nickname
    navigate(`/join-game/${code}`);
  };

  return {
    roomCode,
    setRoomCode,
    error,
    setError,
    isLoading,
    hasExistingSession,
    openJoinPage,
  };
}

const BaseJoinRoom: React.FC<{ layout: "sidebar" | "hero" }> = ({ layout }) => {
  const {
    roomCode,
    setRoomCode,
    error,
    isLoading,
    hasExistingSession,
    openJoinPage,
  } = useJoinRoomLogic();

  const [isDark, setIsDark] = useState(false);

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
    transition: "background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease",
  };

  const InputAndButton =
    layout === "hero" ? (
      <div
        className="d-flex align-items-center justify-content-center gap-3 mt-4 flex-wrap"
        style={{
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <input
          id="roomCode"
          type="search"
          placeholder="Enter room code"
          className="form-control form-control-lg"
          aria-label="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && openJoinPage()}
          disabled={isLoading}
          style={{
            ...commonInputStyles,
            flex: "1 1 auto",
            minWidth: "200px",
            padding: "0.875rem 1.25rem",
            fontSize: "1rem",
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          aria-label="Join room"
          disabled={isLoading || hasExistingSession}
          title={
            hasExistingSession ? "You are already in a session" : "Join room"
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
            }}
          >
            {error}
          </div>
        )}
      </div>
    ) : (
      <div className="px-4 py-3">
        <div className="form-group">
          <div className="input-group">
            <input
              id="roomCode"
              type="text"
              className="form-control form-control-sm"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && openJoinPage()}
              disabled={isLoading}
              style={{
                ...commonInputStyles,
                padding: "0.5rem 0.875rem",
                fontSize: "0.9rem",
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              type="button"
              disabled={isLoading || hasExistingSession}
              onClick={openJoinPage}
              title={
                hasExistingSession ? "You are already in a session" : "Join"
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
                "Join"
              )}
            </button>
          </div>

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
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );

  return <>{InputAndButton}</>;
};

const JoinRoomBox: React.FC = () => <BaseJoinRoom layout="sidebar" />;
export const JoinRoomHero: React.FC = () => <BaseJoinRoom layout="hero" />;
export default JoinRoomBox;