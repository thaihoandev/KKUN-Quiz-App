"use client";

import { joinGame } from "@/services/gameService";
import { getCookie } from "@/utils/handleCookie";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const JoinGamePage: React.FC = () => {
  const { pinCode: pinFromParam } = useParams<{ pinCode?: string }>();
  const [searchParams] = useSearchParams();

  const [pinCode, setPinCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const navigate = useNavigate();

  // Prefill PIN từ param hoặc query (?pin=)
  useEffect(() => {
    const pinFromQuery = searchParams.get("pin") || "";
    setPinCode(pinFromParam || pinFromQuery || "");
  }, [pinFromParam, searchParams]);

  // Prefill nickname từ localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("nickname") || "";
    setNickname(savedName);
  }, []);

  // Nếu đã có session -> đi thẳng WaitingRoom
  useEffect(() => {
    const existingPlayer = localStorage.getItem("playerSession");
    const existingGameId = localStorage.getItem("gameId");
    if (existingPlayer && existingGameId) {
      navigate(`/game-session/${existingGameId}`, { replace: true });
    }
  }, [navigate]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPin = pinCode.trim();
    const trimmedName = nickname.trim();

    if (!trimmedPin) {
      setError("Vui lòng nhập hoặc mở link mời có chứa PIN.");
      return;
    }
    if (!trimmedName) {
      setError("Vui lòng nhập nickname.");
      return;
    }

    try {
      setIsJoining(true);
      const token = getCookie("accessToken");
      const player = await joinGame(trimmedPin, trimmedName, token || undefined);

      // Lưu session cho rejoin
      if (player?.playerId) {
        localStorage.setItem("playerSession", player.playerId);
        localStorage.setItem("gameId", player.gameId);
        localStorage.setItem("nickname", player.nickname || trimmedName);
      }

      navigate(`/game-session/${player.gameId}`, {
        replace: true,
        state: {
          gameData: { gameId: player.gameId, pinCode: trimmedPin },
          quizTitle: "Quiz Game",
          nickname: player.nickname,
          token,
        },
      });
    } catch (err) {
      console.error("Error joining game:", err);
      setError(err instanceof Error ? err.message : "Failed to join game");
    } finally {
      setIsJoining(false);
    }
  };

  const showPinField = !pinCode; // Ẩn ô PIN nếu đã có trong URL/query

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      }}
    >
      <div className="w-100" style={{ maxWidth: 520 }}>
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="text-center text-white py-4"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <h2 className="fw-bold mb-1">
              <i className="bx bx-joystick me-2"></i>Join Game
            </h2>
            <p className="mb-0 opacity-75">
              {showPinField
                ? "Nhập PIN & nickname để tham gia"
                : "Chỉ cần nhập nickname để tham gia"}
            </p>
          </div>

          {/* Body */}
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleJoinGame} className="needs-validation" noValidate>
              {/* Ô PIN: CHỈ hiển thị khi thiếu PIN */}
              {showPinField && (
                <div className="mb-3">
                  <label htmlFor="pinCode" className="form-label">
                    Game PIN
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg rounded-3"
                    id="pinCode"
                    placeholder="Nhập mã PIN"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    required
                  />
                  <div className="form-text">
                    Bạn cũng có thể mở link mời có sẵn PIN để bỏ qua bước này.
                  </div>
                </div>
              )}

              {/* Nickname */}
              <div className="mb-4">
                <label htmlFor="nickname" className="form-label">
                  Nickname
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-3"
                  id="nickname"
                  placeholder="Nhập nickname của bạn"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div className="alert alert-danger rounded-3" role="alert">
                  <i className="bx bx-error-circle me-2"></i>
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="d-grid gap-3">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg rounded-3"
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-log-in me-2"></i>
                      Join Game
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-3"
                  onClick={() => navigate(-1)}
                  disabled={isJoining}
                >
                  <i className="bx bx-arrow-back me-2"></i>
                  Quay lại
                </button>
              </div>
            </form>
          </div>

          {/* Footer hint (không lộ PIN) */}
          {!showPinField && (
            <div className="px-4 pb-4">
              <div className="alert alert-info mb-0 rounded-3">
                <i className="bx bx-info-circle me-2"></i>
                Bạn đang tham gia một phòng — chỉ cần nhập nickname rồi bấm{" "}
                <strong>Join Game</strong>.
              </div>
            </div>
          )}
        </div>

        {/* CTA nhỏ dưới cùng */}
        <div className="text-center text-white-50 mt-3">
          <small>Tip: Lưu nickname của bạn, lần sau vào sẽ nhanh hơn.</small>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePage;
