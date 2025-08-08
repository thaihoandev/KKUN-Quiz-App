import { useState } from "react";
import { Quiz } from "@/interfaces";
import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "@/services/axiosInstance";
import { createGameSession } from "@/services/gameService";
import { useNavigate, Link } from "react-router-dom";

interface QuizCardProps {
  quiz: Quiz;
}

const ProcessQuizCard = ({ quiz }: QuizCardProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();

  const getCategoryColor = (category: string | undefined) => {
    const colors: { [key: string]: string } = {
      Web: "primary",
      "UI/UX": "danger",
      SEO: "success",
      Music: "info",
      Painting: "warning",
    };
    return colors[category || "Other"] || "secondary";
  };

  const displayDescription =
    quiz.description ||
    `A quiz hosted by ${quiz.host.name}. Explore to test your knowledge!`;
  const displayCategory = quiz.category || "Other";
  const displayDuration = quiz.duration || "30 minutes";
  const displayAvatar =
    quiz.host.avatar || "../../assets/img/pages/app-academy-tutor-1.png";

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

  return (
    <div className="col-sm-6 col-lg-4">
      <div className="card p-2 h-100 shadow-none border">
        <div className="card-body p-4 pt-2">
          <div className="d-flex align-items-center mb-3">
            <Link to={`/quizzes/${quiz.quizId}`} className="me-2">
              <img
                className="rounded-circle"
                src={displayAvatar}
                alt={`${quiz.host.name}'s avatar`}
                style={{ width: "40px", height: "40px" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "../../assets/img/pages/app-academy-tutor-1.png";
                }}
              />
            </Link>
            <Link
              to={`/profile/${quiz.host.userId}`}
              className="fw-medium text-decoration-none text-dark"
            >
              {quiz.host.name}
            </Link>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <span
              className={`badge bg-label-${getCategoryColor(
                quiz.category
              )}`}
            >
              {displayCategory}
            </span>
            <p className="d-flex align-items-center justify-content-center fw-medium gap-1 mb-0">
              {quiz.recommendationScore.toFixed(1)}{" "}
              <span className="text-warning">
                <i className="icon-base bx bxs-star me-1 mb-1_5"></i>
              </span>
              <span className="fw-normal">
                ({quiz.viewers?.length || 0})
              </span>
            </p>
          </div>

          <Link
            to={`/quizzes/${quiz.quizId}`}
            className="h5 d-block text-decoration-none text-dark mb-2"
          >
            {quiz.title}
          </Link>

          <p className="mt-1">{displayDescription}</p>

          <p className="d-flex align-items-center mb-1">
            <i className="icon-base bx bx-time-five me-1"></i>
            {displayDuration}
          </p>

          <div className="progress mb-4" style={{ height: "8px" }}>
            <div
              className="progress-bar w-25"
              role="progressbar"
              aria-valuenow={25}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>

          <div className="d-flex flex-column flex-md-row gap-4 text-nowrap flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap">
            <button
              className="w-100 btn btn-label-primary d-flex align-items-center"
              onClick={handleStartQuiz}
              disabled={isStarting}
            >
              <span className="me-2">
                {isStarting ? "Starting..." : "Start Quiz"}
              </span>
              <i className="icon-base bx bx-play-circle icon-sm lh-1 scaleX-n1-rtl"></i>
            </button>
            <Link
              to={`/quizzes/${quiz.quizId}`}
              className="w-100 btn btn-label-warning d-flex align-items-center justify-content-center"
            >
              <span className="me-2">Continue</span>
              <i className="icon-base bx bx-chevron-right icon-sm lh-1 scaleX-n1-rtl"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessQuizCard;
