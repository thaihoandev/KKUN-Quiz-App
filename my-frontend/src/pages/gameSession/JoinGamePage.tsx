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
  const navigate = useNavigate();

  // Prefill PIN từ param hoặc query (?pin=)
  useEffect(() => {
    const pinFromQuery = searchParams.get("pin") || "";
    setPinCode(pinFromParam || pinFromQuery || "");
  }, [pinFromParam, searchParams]);

  // Nếu đã có session đang ở game này thì vào thẳng WaitingRoom
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

    try {
      const token = getCookie("accessToken");
      const player = await joinGame(pinCode.trim(), nickname.trim(), token || undefined);

      // Lưu session cho rejoin
      if (player?.playerId) {
        localStorage.setItem("playerSession", player.playerId);
        localStorage.setItem("gameId", player.gameId);
        localStorage.setItem("nickname", player.nickname || nickname.trim());
      }

      navigate(`/game-session/${player.gameId}`, {
        replace: true,
        state: {
          gameData: { gameId: player.gameId, pinCode },
          quizTitle: "Quiz Game",
          nickname: player.nickname,
          token,
        },
      });
    } catch (err) {
      console.error("Error joining game:", err);
      setError(err instanceof Error ? err.message : "Failed to join game");
    }
  };

  return (
    <div className="container py-5">
      <h2>Join Game</h2>
      <form onSubmit={handleJoinGame}>
        <div className="mb-3">
          <label htmlFor="pinCode" className="form-label">Game PIN</label>
          <input
            type="text"
            className="form-control"
            id="pinCode"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="nickname" className="form-label">Nickname</label>
          <input
            type="text"
            className="form-control"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary">Join Game</button>
      </form>
    </div>
  );
};

export default JoinGamePage;
