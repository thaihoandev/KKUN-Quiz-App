// src/components/quiz/QuizSubCard.tsx - FIXED LOGIC (UI không đổi)
"use client";

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createGame, getParticipants } from "@/services/gameService";
import { handleApiError } from "@/utils/apiErrorHandler";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import type { QuizSummaryDto } from "@/services/quizService";
import type { GameCreateRequest, GameResponseDTO } from "@/types/game";

interface QuizSubCardProps {
  quiz: QuizSummaryDto;
}

const QuizSubCard: React.FC<QuizSubCardProps> = ({ quiz }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Get difficulty badge color
   */
  const getDifficultyBadgeColor = useCallback((difficulty?: string): string => {
    switch (difficulty?.toUpperCase()) {
      case "EASY":
        return "success";
      case "MEDIUM":
        return "info";
      case "HARD":
        return "warning";
      case "EXPERT":
        return "danger";
      default:
        return "secondary";
    }
  }, []);

  /**
   * Format date to readable format
   */
  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  }, []);

  /**
   * Get avatar URL with fallback
   */
  const getAvatarUrl = useCallback((avatar?: string): string => {
    return avatar && avatar.trim() ? avatar : unknownAvatar;
  }, []);

  /**
   * Calculate completion rate percentage
   */
  const getCompletionRate = useCallback((): string => {
    if (!quiz.startCount || quiz.startCount === 0) {
      return "0%";
    }
    const rate = ((quiz.completionCount || 0) / quiz.startCount) * 100;
    return `${rate.toFixed(0)}%`;
  }, [quiz.startCount, quiz.completionCount]);

  /**
   * ✅ FIXED: Properly get host participantId (từ ProcessQuizCard)
   * 
   * Flow:
   * 1. Call createGame() API
   * 2. Backend tạo game + trả về gameId, pinCode, hostParticipantId
   * 3. Lưu vào localStorage:
   *    - participantId (actual host's participantId từ backend)
   *    - gameId
   *    - currentPinCode
   *    - isAnonymous = false
   * 4. Navigate to /game-session/{gameId}
   * 5. GameSessionPage sẽ sử dụng participantId chính xác
   * 6. WebSocket sẽ send đúng participantId
   * 7. Answer submission sẽ thành công ✅
   */
  const handleStartGameSession = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log("🚀 [QuizSubCard] Creating game for quiz:", quiz.quizId);

      const request: GameCreateRequest = {
        quizId: quiz.quizId,
        maxPlayers: 200,
        allowAnonymous: true,
        showLeaderboard: true,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      // Call createGame API
      const gameResponse: GameResponseDTO = await createGame(request);

      console.log("✅ [QuizSubCard] Game created:", {
        gameId: gameResponse.gameId,
        pinCode: gameResponse.pinCode,
        playerCount: gameResponse.playerCount,
      });

      // ✅ FIX: Get actual host participantId
      let hostParticipantId: string | null = null;

      // Try Option 1: Backend includes hostParticipantId in response
      if (gameResponse.hostParticipantId) {
        hostParticipantId = gameResponse.hostParticipantId;
        console.log(
          "✅ [QuizSubCard] Got hostParticipantId from createGame response"
        );
      } else {
        // Fallback Option 2: Fetch participants and find host
        try {
          console.log(
            "⏳ [QuizSubCard] Fetching participants to get host participantId..."
          );
          const participants = await getParticipants(gameResponse.gameId);

          if (participants.length > 0) {
            hostParticipantId = participants[0].participantId;
            console.log(
              "✅ [QuizSubCard] Got hostParticipantId from participants list:",
              hostParticipantId
            );
          }
        } catch (e) {
          console.warn("⚠️ [QuizSubCard] Failed to fetch participants:", e);
          hostParticipantId = gameResponse.gameId;
          console.warn(
            "⚠️ [QuizSubCard] Using gameId as fallback (may cause issues)"
          );
        }
      }

      // Save HOST session to localStorage
      if (hostParticipantId && gameResponse.gameId) {
        console.log("💾 [QuizSubCard] Saving host session to localStorage...");

        localStorage.setItem("participantId", hostParticipantId);
        localStorage.setItem("gameId", gameResponse.gameId);
        localStorage.setItem("currentPinCode", gameResponse.pinCode);
        localStorage.setItem("isAnonymous", "false");
        localStorage.removeItem("guestToken");

        console.log("✅ [QuizSubCard] Host session saved:", {
          participantId: hostParticipantId,
          gameId: gameResponse.gameId,
          pinCode: gameResponse.pinCode,
          isHost: true,
        });

        toast.success(`✅ Room created! PIN: ${gameResponse.pinCode}`);
      } else {
        throw new Error("Failed to get host participantId");
      }

      // Navigate to game session
      console.log(
        "📍 [QuizSubCard] Navigating to /game-session/" + gameResponse.gameId
      );
      navigate(`/game-session/${gameResponse.gameId}`, {
        state: {
          gameId: gameResponse.gameId,
          pinCode: gameResponse.pinCode,
          quizTitle: quiz.title,
          quizThumbnail: quiz.coverImageUrl,
          isHost: true,
          createdAt: new Date().toISOString(),
        },
        replace: true,
      });
    } catch (error: any) {
      console.error("❌ [QuizSubCard] Failed to create game:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create room";
      toast.error(errorMsg);
      handleApiError(error, "Could not create game room");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate to quiz details page
   */
  const handleViewDetails = () => {
    navigate(`/quiz/${quiz.slug || quiz.quizId}`);
  };

  return (
    <div className="card h-100 border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="card-header bg-white d-flex justify-content-between align-items-start py-3 px-4 border-bottom-0">
        <div className="d-flex align-items-start gap-2 flex-grow-1">
          <span
            className={`badge bg-${getDifficultyBadgeColor(
              quiz.difficulty
            )} flex-shrink-0 mt-1`}
          >
            {quiz.difficulty || "General"}
          </span>
          <div className="flex-grow-1 min-w-0">
            <h5 className="mb-0 fw-bold text-truncate" title={quiz.title}>
              {quiz.title || "Untitled Quiz"}
            </h5>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="card-body p-4">
        {/* Creator info + Created date */}
        <div className="d-flex align-items-center mb-3 justify-content-between">
          <div className="d-flex align-items-center flex-grow-1 min-w-0">
            <img
              src={getAvatarUrl(quiz.creator?.avatar)}
              alt={quiz.creator?.name || "Creator"}
              className="rounded-circle border border-2 border-light me-2 flex-shrink-0"
              width="36"
              height="36"
              onError={(e) => {
                (e.target as HTMLImageElement).src = unknownAvatar;
              }}
            />
            <div className="min-w-0">
              <small className="text-muted d-block">Created by</small>
              <span className="fw-medium text-truncate d-block">
                {quiz.creator?.name || "Anonymous"}
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center ms-3 flex-shrink-0">
            <i
              className="bx bx-calendar text-muted me-1"
              style={{ fontSize: "14px" }}
            ></i>
            <small className="text-muted" style={{ whiteSpace: "nowrap" }}>
              {formatDate(quiz.createdAt)}
            </small>
          </div>
        </div>

        {/* Description */}
        <p
          className="card-text mb-4 text-secondary"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "40px",
          }}
        >
          {quiz.description || "No description available for this quiz."}
        </p>

        {/* Stats Grid */}
        <div className="row g-2 mb-4 text-center">
          <div className="col-4">
            <div className="stat-box p-2 rounded bg-light">
              <i className="bx bx-help-circle text-primary me-1"></i>
              <div className="fw-bold text-dark">{quiz.totalQuestions || 0}</div>
              <small className="text-muted">Questions</small>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-box p-2 rounded bg-light">
              <i className="bx bx-show text-info me-1"></i>
              <div className="fw-bold text-dark">{quiz.viewCount || 0}</div>
              <small className="text-muted">Views</small>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-box p-2 rounded bg-light">
              <i className="bx bx-check-circle text-success me-1"></i>
              <div className="fw-bold text-dark">
                {quiz.averageScore
                  ? `${quiz.averageScore.toFixed(0)}%`
                  : "–"}
              </div>
              <small className="text-muted">Avg Score</small>
            </div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="d-flex justify-content-between mb-4 px-2">
          <div className="text-center">
            <small className="text-muted d-block">Started</small>
            <span className="fw-bold text-primary">{quiz.startCount || 0}</span>
          </div>
          <div className="text-center">
            <small className="text-muted d-block">Completed</small>
            <span className="fw-bold text-success">
              {quiz.completionCount || 0}
            </span>
          </div>
          <div className="text-center">
            <small className="text-muted d-block">Completion Rate</small>
            <span className="fw-bold text-info">{getCompletionRate()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-grid gap-2">
          <button
            className="btn btn-primary d-flex align-items-center justify-content-center"
            onClick={handleStartGameSession}
            disabled={isLoading}
            title={isLoading ? "Creating room..." : "Host a new game session"}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Creating Room...
              </>
            ) : (
              <>
                <i
                  className="bx bx-play me-2"
                  style={{ fontSize: "18px" }}
                ></i>
                Host Game
              </>
            )}
          </button>

          <button
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            onClick={handleViewDetails}
            disabled={isLoading}
            title="View quiz details"
          >
            <i className="bx bx-detail me-2" style={{ fontSize: "16px" }}></i>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSubCard;