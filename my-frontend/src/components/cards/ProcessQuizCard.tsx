import { useState, useEffect } from "react";
import { handleApiError } from "@/utils/apiErrorHandler";
import { createGameSession } from "@/services/gameService";
import { useNavigate, Link } from "react-router-dom";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { QuizSummaryDto } from "@/services/quizService";

interface ProcessQuizCardProps {
  quiz: QuizSummaryDto;
}

const ProcessQuizCard = ({ quiz }: ProcessQuizCardProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  // Detect dark/light mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Category color mapping (có thể mở rộng sau)
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
  const displayDescription =
    quiz.description || "Test your knowledge with this exciting quiz!";
  const displayCreatorName = quiz.creator?.name || "Anonymous";
  const displayCreatorId = quiz.creator?.userId || "";
  const displayAvatar = unknownAvatar; // Backend hiện tại không trả avatar → fallback
  const displayDuration = quiz.estimatedMinutes
    ? `${quiz.estimatedMinutes} min${quiz.estimatedMinutes > 1 ? "s" : ""}`
    : "Flexible time";
  const categoryColor = getCategoryColor(); // Có thể mở rộng bằng tag sau

  // Tính điểm khuyến nghị (nếu backend chưa có recommendationScore, tự ước lượng)
  const recommendationScore =
    quiz.averageScore !== undefined && quiz.averageScore > 0
      ? quiz.averageScore.toFixed(1)
      : ((quiz.completionCount || 0) / Math.max(quiz.startCount || 1, 1)) * 10;

  const playerCount = quiz.startCount || 0;

  const handleStartQuiz = async () => {
    setIsStarting(true);
    try {
      const response = await createGameSession(quiz.quizId);
      navigate(`/game-session/${response.gameId}`, {
        state: { quizTitle: quiz.title },
      });
    } catch (error) {
      handleApiError(error, "Không thể bắt đầu quiz");
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
        e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
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
          <Link to={`/profile/${displayCreatorId}`} className="me-3">
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
          </Link>
          <div>
            <Link
              to={`/profile/${displayCreatorId}`}
              className="text-decoration-none fw-medium"
              style={{ color: "var(--text-color)", fontSize: "0.95rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-color)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-color)")}
            >
              {displayCreatorName}
            </Link>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Creator
            </div>
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
        <Link
          to={`/quiz/${quiz.quizId}`}
          className="text-decoration-none mb-3"
          style={{
            display: "block",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "var(--text-color)",
            lineHeight: 1.3,
            transition: "color 0.CurrentTarget25s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-color)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-color)")}
        >
          {displayTitle}
        </Link>

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
            <span>{quiz.totalQuestions} questions</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <i className="bx bx-time-five"></i>
            <span>{displayDuration}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-3 mt-auto">
          <button
            className="btn flex-fill fw-bold text-white"
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
            }}
            onClick={handleStartQuiz}
            disabled={isStarting}
            onMouseEnter={(e) => !isStarting && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {isStarting ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Starting...
              </>
            ) : (
              <>
                <i className="bx bx-play-circle" style={{ fontSize: "1.3rem" }}></i>
                Start Quiz
              </>
            )}
          </button>

          <Link
            to={`/quiz/${quiz.slug || quiz.quizId}`}
            className="btn flex-fill fw-bold"
            style={{
              background: "var(--surface-alt)",
              color: "var(--primary-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "12px",
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              textDecoration: "none",
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
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProcessQuizCard;