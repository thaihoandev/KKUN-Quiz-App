import { useState, useEffect } from "react";
import { Quiz } from "@/interfaces";
import { handleApiError } from "@/utils/apiErrorHandler";
import { createGameSession } from "@/services/gameService";
import { useNavigate, Link } from "react-router-dom";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";

interface QuizCardProps {
  quiz: Quiz;
}

const ProcessQuizCard = ({ quiz }: QuizCardProps) => {
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

  const getCategoryColor = (category: string | undefined) => {
    const colors: { [key: string]: string } = {
      Web: "#60a5fa",
      "UI/UX": "#f87171",
      SEO: "#4ade80",
      Music: "#38bdf8",
      Painting: "#fbbf24",
    };
    return colors[category || "Other"] || "#a5b4fc";
  };

  const displayDescription =
    quiz.description ||
    `A quiz hosted by ${quiz.host.name}. Explore to test your knowledge!`;
  const displayCategory = quiz.category || "Other";
  const displayDuration = quiz.duration || "30 minutes";
  const displayAvatar = quiz.host.avatar || unknownAvatar;

  const handleStartQuiz = async () => {
    setIsStarting(true);
    try {
      const response = await createGameSession(quiz.quizId);
      const gameId = response.gameId;
      setTimeout(() => {
        navigate(`/game-session/${gameId}`, {
          state: { response, quizTitle: quiz.title },
        });
      }, 0);
    } catch (error) {
      handleApiError(error, "Failed to start quiz");
    } finally {
      setIsStarting(false);
    }
  };

  const categoryColor = getCategoryColor(quiz.category);

  return (
    <div
      className="card p-2 h-100 shadow-none"
      style={{
        border: "2px solid var(--border-color)",
        background: "var(--surface-color)",
        transition: "all 0.25s ease",
        borderRadius: "14px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--hover-shadow)";
        e.currentTarget.style.borderColor = "var(--primary-color)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
        <div className="card-body p-4 pt-2">
          {/* Host Info */}
          <div className="d-flex align-items-center mb-3">
            <Link
              to={`/quizzes/${quiz.quizId}`}
              className="me-2"
              style={{ textDecoration: "none" }}
            >
              <img
                className="rounded-circle"
                src={displayAvatar}
                alt={`${quiz.host.name}'s avatar`}
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                  border: "2px solid var(--border-color)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(96, 165, 250, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onError={(e) => {
                  e.currentTarget.src = unknownAvatar;
                }}
              />
            </Link>
            <Link
              to={`/profile/${quiz.host.userId}`}
              style={{
                fontWeight: 500,
                textDecoration: "none",
                color: "var(--text-color)",
                transition: "color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--primary-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-color)";
              }}
            >
              {quiz.host.name}
            </Link>
          </div>

          {/* Badge & Rating */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span
              style={{
                display: "inline-block",
                padding: "0.35rem 0.75rem",
                borderRadius: "50px",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
                transition: "all 0.25s ease",
              }}
            >
              {displayCategory}
            </span>

            <div
              className="d-flex align-items-center justify-content-center fw-medium gap-1"
              style={{
                color: "var(--text-color)",
                transition: "color 0.25s ease",
              }}
            >
              <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                {quiz.recommendationScore.toFixed(1)}
              </span>
              <span style={{ color: "#fbbf24", fontSize: "1.1rem" }}>
                <i className="bx bxs-star"></i>
              </span>
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                }}
              >
                ({quiz.viewers?.length || 0})
              </span>
            </div>
          </div>

          {/* Title */}
          <Link
            to={`/quizzes/${quiz.quizId}`}
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              display: "block",
              textDecoration: "none",
              color: "var(--text-color)",
              marginBottom: "0.75rem",
              lineHeight: 1.4,
              transition: "color 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-color)";
            }}
          >
            {quiz.title}
          </Link>

          {/* Description */}
          <p
            style={{
              color: "var(--text-light)",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              marginTop: "0.75rem",
              marginBottom: "1rem",
              transition: "color 0.25s ease",
            }}
          >
            {displayDescription}
          </p>

          {/* Duration */}
          <p
            className="d-flex align-items-center mb-3"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              transition: "color 0.25s ease",
            }}
          >
            <i
              className="bx bx-time-five"
              style={{
                marginRight: "0.5rem",
                fontSize: "1.1rem",
                color: "var(--primary-color)",
              }}
            ></i>
            {displayDuration}
          </p>

          {/* Progress Bar */}
          <div
            className="progress mb-4"
            style={{
              height: "8px",
              backgroundColor: "var(--surface-alt)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: "25%",
                background: "var(--gradient-primary)",
                transition: "width 0.6s ease",
              }}
              aria-valuenow={25}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>

          {/* Action Buttons */}
          <div
            className="d-flex flex-column flex-md-row gap-2 flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap"
            style={{
              gap: "0.75rem",
            }}
          >
            <button
              className="w-100 btn"
              onClick={handleStartQuiz}
              disabled={isStarting}
              style={{
                background: "var(--gradient-primary)",
                color: "white",
                fontWeight: 600,
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.25s ease",
                opacity: isStarting ? 0.7 : 1,
                cursor: isStarting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isStarting) {
                  e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "0.95rem" }}>
                {isStarting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      style={{ marginRight: "0.5rem" }}
                    />
                    Starting...
                  </>
                ) : (
                  <>
                    <i className="bx bx-play-circle" style={{ fontSize: "1.1rem" }}></i>
                    Start Quiz
                  </>
                )}
              </span>
            </button>

            <Link
              to={`/quizzes/${quiz.quizId}`}
              className="w-100 btn"
              style={{
                background: "var(--surface-alt)",
                color: "var(--primary-color)",
                fontWeight: 600,
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                border: "2px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                textDecoration: "none",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gradient-primary)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-alt)";
                e.currentTarget.style.color = "var(--primary-color)";
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "0.95rem" }}>
                <i className="bx bx-chevron-right" style={{ fontSize: "1.1rem" }}></i>
                Continue
              </span>
            </Link>
          </div>
        </div>
      </div>
  );
};

export default ProcessQuizCard;