// ...imports giữ nguyên
import { useState } from "react";
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
    roomCode, setRoomCode,
    error, setError,
    isLoading,
    hasExistingSession,
    openJoinPage,
  };
}

const BaseJoinRoom: React.FC<{ layout: "sidebar" | "hero" }> = ({ layout }) => {
  const {
    roomCode, setRoomCode,
    error,
    isLoading, hasExistingSession,
    openJoinPage,
  } = useJoinRoomLogic();

  const InputAndButton =
    layout === "hero" ? (
      <div className="d-flex align-items-center justify-content-center gap-2 mt-4" style={{ maxWidth: 560, margin: "0 auto" }}>
        <input
          id="roomCode"
          type="search"
          placeholder="Enter room code"
          className="form-control form-control-lg rounded-3"
          aria-label="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && openJoinPage()}
          disabled={isLoading}
        />
        <button
          type="button"
          className="btn btn-primary btn-lg rounded-3"
          aria-label="Join room"
          disabled={isLoading || hasExistingSession}
          title={hasExistingSession ? "You are already in a session" : "Join"}
          onClick={openJoinPage}
        >
          {isLoading ? <span className="spinner-border spinner-border-sm" /> : <i className="icon-base bx bx-right-arrow-circle" />}
        </button>
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
            />
            <button
              className="btn btn-primary btn-sm"
              type="button"
              disabled={isLoading || hasExistingSession}
              onClick={openJoinPage}
              title={hasExistingSession ? "You are already in a session" : "Join"}
            >
              {isLoading ? <span className="spinner-border spinner-border-sm"></span> : "Join"}
            </button>
          </div>
          {error && <div className="text-danger mt-2">{error}</div>}
        </div>
      </div>
    );

  return <>{InputAndButton}</>;
};

const JoinRoomBox: React.FC = () => <BaseJoinRoom layout="sidebar" />;
export const JoinRoomHero: React.FC = () => <BaseJoinRoom layout="hero" />;
export default JoinRoomBox;
