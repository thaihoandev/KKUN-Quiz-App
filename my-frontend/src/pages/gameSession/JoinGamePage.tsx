"use client";

import { joinGame } from "@/services/gameService";
import { getCookie } from "@/utils/handleCookie";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const JoinGamePage: React.FC = () => {
  const [pinCode, setPinCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Lấy token từ cookie "accessToken"
      const token = getCookie('accessToken');
      const player = await joinGame(pinCode, nickname, token || undefined);

      // Navigate to WaitingRoomSessionPage với state
      navigate(`/waiting-room/${player.gameId}`, {
        state: {
          gameData: {
            gameId: player.gameId,
            pinCode: pinCode,
            // Thêm các trường khác nếu cần
          },
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
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}
        <button type="submit" className="btn btn-primary">
          Join Game
        </button>
      </form>
    </div>
  );
};

export default JoinGamePage;
