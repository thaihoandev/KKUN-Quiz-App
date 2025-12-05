"use client";

import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { QuizSummaryDto } from "@/services/quizService";

interface User {
  userId: string;
  name: string;
  avatar?: string;
}

interface QuizCardProps {
  quiz: QuizSummaryDto;
}

const QuizSubCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const getDifficultyBadgeColor = useCallback(
    (difficulty: string) => {
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
    },
    []
  );

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  }, []);

  const getAvatarUrl = useCallback((avatar?: string) => {
    return avatar && avatar.trim() ? avatar : unknownAvatar;
  }, []);

  const handleStartGameSession = async () => {
    try {
      setIsLoading(true);
      const { createGameSession } = await import("@/services/gameService");
      const gameData = await createGameSession(quiz.quizId);

      navigate(`/game-session/${gameData.gameId}`, {
        state: {
          gameData,
          quizTitle: quiz.title,
        },
      });
    } catch (error) {
      console.error("Error creating game session:", error);
      alert("Failed to start game session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    navigate(`/quiz/${quiz.slug}`);
  };
  
  return (
    <div className="card h-100 border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
      {/* Card Header - Difficulty Badge & Title */}
      <div className="card-header bg-white d-flex justify-content-between align-items-start py-3 px-4">
        <div className="d-flex align-items-start gap-2 flex-grow-1">
          <span
            className={`badge bg-${getDifficultyBadgeColor(
              quiz.difficulty
            )} flex-shrink-0 mt-1`}
          >
            {quiz.difficulty}
          </span>
          <div className="flex-grow-1 min-w-0">
            <h5 className="mb-0 fw-bold text-truncate" title={quiz.title}>
              {quiz.title}
            </h5>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-4">
        {/* Creator Information */}
        <div className="d-flex align-items-center mb-3 justify-content-between">
          <div className="d-flex align-items-center flex-grow-1 min-w-0">
            <img
              src={getAvatarUrl(quiz.creator?.avatar)}
              alt={quiz.creator.name}
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
                {quiz.creator.name}
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
          className="card-text mb-4 text-secondary text-truncate-3"
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

        {/* Quiz Stats */}
        <div className="row g-2 mb-4 text-center">
          <div className="col-4">
            <div className="stat-box p-2 rounded bg-light">
              <i className="bx bx-help-circle text-primary me-1"></i>
              <div className="fw-bold text-dark">{quiz.totalQuestions}</div>
              <small className="text-muted">Questions</small>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-box p-2 rounded bg-light">
              <i className="bx bx-show text-info me-1"></i>
              <div className="fw-bold text-dark">{quiz.viewCount}</div>
              <small className="text-muted">Views</small>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-box p-2 rounded bg-light">
              <i className="bx bx-check-circle text-success me-1"></i>
              <div className="fw-bold text-dark">
                {quiz.averageScore.toFixed(0)}%
              </div>
              <small className="text-muted">Avg Score</small>
            </div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="d-flex justify-content-between mb-4 px-2">
          <div className="text-center">
            <small className="text-muted d-block">Started</small>
            <span className="fw-bold text-primary">{quiz.startCount}</span>
          </div>
          <div className="text-center">
            <small className="text-muted d-block">Completed</small>
            <span className="fw-bold text-success">
              {quiz.completionCount}
            </span>
          </div>
          <div className="text-center">
            <small className="text-muted d-block">Completion Rate</small>
            <span className="fw-bold text-info">
              {quiz.startCount > 0
                ? ((quiz.completionCount / quiz.startCount) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-grid gap-2">
          <button
            className="btn btn-primary d-flex align-items-center justify-content-center"
            onClick={handleStartGameSession}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Starting...
              </>
            ) : (
              <>
                <i
                  className="bx bx-play me-2"
                  style={{ fontSize: "18px" }}
                ></i>
                Start Quiz
              </>
            )}
          </button>
          <button
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            onClick={handleViewDetails}
          >
            <i className="bx bx-detail me-2" style={{ fontSize: "16px" }}></i>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

QuizSubCard.propTypes = {
  quiz: PropTypes.shape({
    quizId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    slug: PropTypes.string.isRequired,
    difficulty: PropTypes.string.isRequired,
    totalQuestions: PropTypes.number.isRequired,
    averageScore: PropTypes.number.isRequired,
    viewCount: PropTypes.number.isRequired,
    startCount: PropTypes.number.isRequired,
    completionCount: PropTypes.number.isRequired,
    creator: PropTypes.shape({
      userId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
    }).isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default QuizSubCard;