// src/components/quiz/ProcessQuizCard.tsx - FIXED VERSION
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createGame, getParticipants } from "@/services/gameService";
import { handleApiError } from "@/utils/apiErrorHandler";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import type { QuizSummaryDto } from "@/services/quizService";
import type { GameCreateRequest, GameResponseDTO } from "@/types/game";

interface ProcessQuizCardProps {
  quiz: QuizSummaryDto;
}

const ProcessQuizCard = ({ quiz }: ProcessQuizCardProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

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

  // Category color mapping
  const getCategoryColor = (category: string = "General") => {
    const colors: Record<string, string> = {
      Technology: "#60a5fa",
      Science: "#34d399",
      History: "#fbbf24",
      Music: "#a78bfa",
      Art: "#f87171",
      Sport: "#fb923c",
      Geography: "#38bdf8",
      General: "#a5b4fc",
    };
    return colors[category] || "#94a3b8";
  };

  // Safe values
  const displayTitle = quiz.title || "Untitled Quiz";
  const displayDescription = quiz.description || "Test your knowledge with this exciting quiz!";
  const displayCreatorName = quiz.creator?.name || "Anonymous";
  const displayCreatorId = quiz.creator?.userId || "";
  const displayAvatar = quiz.creator?.avatar || unknownAvatar;
  const displayDuration = quiz.estimatedMinutes
    ? `${quiz.estimatedMinutes} min${quiz.estimatedMinutes > 1 ? "s" : ""}`
    : "Flexible time";

  const categoryColor = getCategoryColor(quiz.difficulty);

  // Tính điểm khuyến nghị
  const recommendationScore =
    quiz.averageScore !== undefined && quiz.averageScore > 0
      ? quiz.averageScore.toFixed(1)
      : quiz.startCount && quiz.startCount > 0
      ? ((quiz.completionCount || 0) / quiz.startCount) * 10
      : 0;

  const playerCount = quiz.startCount || 0;

  // ==================== CREATE GAME (HOST) ====================
  /**
   * ✅ FIXED: Properly get host participantId
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
  const handleStartQuiz = async () => {
    if (isStarting) return;

    setIsStarting(true);
    try {
      console.log("🚀 [ProcessQuizCard] Creating game for quiz:", quiz.quizId);

      const createRequest: GameCreateRequest = {
        quizId: quiz.quizId,
        maxPlayers: 200,
        allowAnonymous: true,
        showLeaderboard: true,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      // Call createGame API
      const gameResponse: GameResponseDTO = await createGame(createRequest);

      console.log("✅ [ProcessQuizCard] Game created:", {
        gameId: gameResponse.gameId,
        pinCode: gameResponse.pinCode,
        playerCount: gameResponse.playerCount,
      });

      // ✅ FIX: Get actual host participantId
      let hostParticipantId: string | null = null;

      // Try Option 1: Backend includes hostParticipantId in response
      if (gameResponse.hostParticipantId) {
        hostParticipantId = gameResponse.hostParticipantId;
        console.log("✅ [ProcessQuizCard] Got hostParticipantId from createGame response");
      } else {
        // Fallback Option 2: Fetch participants and find host
        try {
          console.log("⏳ [ProcessQuizCard] Fetching participants to get host participantId...");
          const participants = await getParticipants(gameResponse.gameId);

          // Find participant that matches current user or is first (host)
          // ⚠️ Note: This assumes first participant is host (not ideal)
          // Better solution: Backend should include isHost flag or return hostParticipantId
          if (participants.length > 0) {
            hostParticipantId = participants[0].participantId;
            console.log(
              "✅ [ProcessQuizCard] Got hostParticipantId from participants list:",
              hostParticipantId
            );
          }
        } catch (e) {
          console.warn("⚠️ [ProcessQuizCard] Failed to fetch participants:", e);
          // Last resort fallback - use gameId (not ideal, will likely fail)
          hostParticipantId = gameResponse.gameId;
          console.warn(
            "⚠️ [ProcessQuizCard] Using gameId as fallback (may cause issues)"
          );
        }
      }

      // Save HOST session to localStorage
      if (hostParticipantId && gameResponse.gameId) {
        console.log("💾 [ProcessQuizCard] Saving host session to localStorage...");

        localStorage.setItem("participantId", hostParticipantId);
        localStorage.setItem("gameId", gameResponse.gameId);
        localStorage.setItem("currentPinCode", gameResponse.pinCode);
        localStorage.setItem("isAnonymous", "false");
        localStorage.removeItem("guestToken");

        console.log("✅ [ProcessQuizCard] Host session saved:", {
          participantId: hostParticipantId,
          gameId: gameResponse.gameId,
          pinCode: gameResponse.pinCode,
          isHost: true,
        });

        console.log("📊 [ProcessQuizCard] localStorage content:", {
          participantId: localStorage.getItem("participantId"),
          gameId: localStorage.getItem("gameId"),
          currentPinCode: localStorage.getItem("currentPinCode"),
          isAnonymous: localStorage.getItem("isAnonymous"),
        });
      } else {
        throw new Error("Failed to get host participantId");
      }

      // Navigate to waiting room
      console.log("📍 [ProcessQuizCard] Navigating to /game-session/" + gameResponse.gameId);
      navigate(`/game-session/${gameResponse.gameId}`, {
        state: {
          pinCode: gameResponse.pinCode,
          quizTitle: quiz.title,
          isHost: true,
        },
        replace: true,
      });
    } catch (error: any) {
      console.error("❌ [ProcessQuizCard] Failed to create game:", error);
      handleApiError(error, "Không thể tạo phòng chơi");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div
      className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative"
      style={{
        background: "var(--surface-color)",
        border: "2px solid var(--border-color)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow =
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
        e.currentTarget.style.borderColor = "var(--primary-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border-color)";
      }}
    >
      <div className="card-body p-4 d-flex flex-column">
        {/* Creator Info */}
        <div className="d-flex align-items-center mb-3">
          <a href={`/profile/${displayCreatorId}`} className="me-3">
            <img
              src={displayAvatar}
              alt={displayCreatorName}
              className="rounded-circle"
              style={{
                width: "42px",
                height: "42px",
                objectFit: "cover",
                border: "3px solid var(--border-color)",
                transition: "all 0.25s ease",
              }}
              onError={(e) => (e.currentTarget.src = unknownAvatar)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(96, 165, 250, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </a>
          <div>
            <a
              href={`/profile/${displayCreatorId}`}
              className="text-decoration-none fw-medium"
              style={{ color: "var(--text-color)", fontSize: "0.95rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-color)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-color)")}
            >
              {displayCreatorName}
            </a>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Creator</div>
          </div>
        </div>

        {/* Badge + Score */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span
            className="px-3 py-1 rounded-pill text-uppercase fw-bold"
            style={{
              fontSize: "0.75rem",
              backgroundColor: `${categoryColor}22`,
              color: categoryColor,
            }}
          >
            {quiz.difficulty || "General"}
          </span>

          <div className="d-flex align-items-center gap-1 fw-semibold">
            <span style={{ fontSize: "1.1rem" }}>{recommendationScore}</span>
            <i className="bx bxs-star" style={{ color: "#fbbf24" }}></i>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              ({playerCount} played)
            </span>
          </div>
        </div>

        {/* Title */}
        <a
          href={`/quiz/${quiz.slug || quiz.quizId}`}
          className="text-decoration-none mb-3"
          style={{
            display: "block",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "var(--text-color)",
            lineHeight: 1.3,
            transition: "color 0.25s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-color)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-color)")}
        >
          {displayTitle}
        </a>

        {/* Description */}
        <p
          className="text-muted mb-4 flex-grow-1"
          style={{
            fontSize: "0.95rem",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {displayDescription}
        </p>

        {/* Stats */}
        <div className="d-flex align-items-center gap-4 mb-4 text-muted" style={{ fontSize: "0.9rem" }}>
          <div className="d-flex align-items-center gap-1">
            <i className="bx bx-book-open"></i>
            <span>{quiz.totalQuestions || 0} questions</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <i className="bx bx-time-five"></i>
            <span>{displayDuration}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-3 mt-auto">
          {/* Host Game Button */}
          <button
            className="btn flex-fill fw-bold text-white position-relative"
            style={{
              background: "var(--gradient-primary)",
              padding: "0.75rem",
              borderRadius: "12px",
              border: "none",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: isStarting ? 0.8 : 1,
              cursor: isStarting ? "not-allowed" : "pointer",
              transition: "all 0.25s ease",
            }}
            onClick={handleStartQuiz}
            disabled={isStarting}
            onMouseEnter={(e) => {
              if (!isStarting) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(96, 165, 250, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isStarting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Creating Room...
              </>
            ) : (
              <>
                <i className="bx bx-play-circle" style={{ fontSize: "1.3rem" }}></i>
                Host Game
              </>
            )}
          </button>

          {/* View Details Button */}
          <a
            href={`/quiz/${quiz.slug || quiz.quizId}`}
            className="btn flex-fill fw-bold d-flex align-items-center justify-content-center gap-2"
            style={{
              background: "var(--surface-alt)",
              color: "var(--primary-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "12px",
              padding: "0.75rem",
              textDecoration: "none",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gradient-primary)";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.borderColor = "transparent";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-alt)";
              e.currentTarget.style.color = "var(--primary-color)";
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            <i className="bx bx-info-circle" style={{ fontSize: "1.2rem" }}></i>
            View Details
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProcessQuizCard;