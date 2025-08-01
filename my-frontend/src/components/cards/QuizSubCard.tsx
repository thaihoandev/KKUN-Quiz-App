"use client";

import React, {useState, useCallback} from "react";
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";
import QuizDropdown from "../dropdowns/QuizDropdown";
import {createGameSession} from "@/services/gameService";

import unknownAvatar from "@/assets/img/avatars/unknown.jpg"; // Default avatar image
import { GameStatus, Quiz, QuizStatus } from "@/interfaces";


interface QuizCardProps {
    quiz: Quiz;
}

const QuizSubCard: React.FC<QuizCardProps> = ({quiz}) => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Determine badge color based on status
    const getStatusBadgeColor = useCallback(() => {
        switch (quiz.status) {
            case QuizStatus.PUBLISHED:
                return "success";
            case QuizStatus.DRAFT:
                return "secondary";
            case QuizStatus.CLOSED:
                return "warning";
            case QuizStatus.ARCHIVED:
                return "dark";
            default:
                return "primary"; // Fallback color
        }
    }, [quiz.status]);

    // Format date to be more readable
    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }, []);

    const handleStartGameSession = async () => {
        try {
            setIsLoading(true);
            const gameData = await createGameSession(quiz.quizId);

            setTimeout(() => {
                navigate(`/game-session/${gameData.gameId}`, {
                    state: {
                        gameData,
                        quizTitle: quiz.title,
                    },
                });
            }, 0);
        } catch (error) {
            console.error("Error creating game session:", error);
            alert("Failed to start game session. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card h-100 border-0 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg overflow-hidden">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 px-4 border-bottom border-light">
                <div className="d-flex align-items-center">
                    <div className={`badge bg-${getStatusBadgeColor()} me-2`}>
                        {quiz.status}
                    </div>
                    <h5 className="mb-0 fw-bold">{quiz.title}</h5>
                </div>
                <QuizDropdown quizId={quiz.quizId} />
            </div>

            <div className="card-body p-4">
                {/* Host Information */}
                <div className="d-flex align-items-center mb-3">
                    <img
                        src={quiz.host.avatar || unknownAvatar}
                        alt={quiz.host.name}
                        className="rounded-circle border border-2 border-light me-2"
                        width="36"
                        height="36"
                    />
                    <div>
                        <small className="text-muted d-block">Created by</small>
                        <span className="fw-medium">{quiz.host.name}</span>
                    </div>

                    <div className="ms-auto d-flex align-items-center">
                        <i
                            className="bx bx-calendar text-muted me-1"
                            style={{fontSize: "14px"}}
                        ></i>
                        <small className="text-muted">
                            {formatDate(quiz.updatedAt)}
                        </small>
                    </div>
                </div>

                {/* Description */}
                <p className="card-text mb-4 text-secondary">
                    {quiz.description ||
                        "No description available for this quiz."}
                </p>

                {/* Participants Section */}
                <div className="d-flex justify-content-between mb-4">
                    {/* Viewers */}
                    <div
                        className="d-flex align-items-center"
                        key={`viewers-${quiz.quizId}`}
                    >
                        <div className="d-flex align-items-center me-3">
                            <i
                                className="bx bx-group text-primary me-1"
                                style={{fontSize: "16px"}}
                            ></i>
                            <span className="fw-medium">
                                {quiz.viewers.length}
                            </span>
                        </div>
                        <div className="avatar-group">
                            {quiz.viewers.slice(0, 3).map((user, index) => (
                                <img
                                    key={`${user.userId}-viewer`}
                                    src={user.avatar || unknownAvatar}
                                    alt={user.name}
                                    className="rounded-circle border-2 border-white"
                                    width="28"
                                    height="28"
                                    title={user.name}
                                    style={{
                                        marginLeft: index === 0 ? 0 : "-8px",
                                        zIndex: 3 - index,
                                        position: "relative",
                                    }}
                                />
                            ))}
                            {quiz.viewers.length > 3 && (
                                <span
                                    key={`viewers-more-${quiz.quizId}`}
                                    className="avatar-more rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "28px",
                                        height: "28px",
                                        marginLeft: "-8px",
                                        fontSize: "0.7rem",
                                        border: "2px solid white",
                                        position: "relative",
                                    }}
                                >
                                    +{quiz.viewers.length - 3}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Editors */}
                    <div
                        className="d-flex align-items-center"
                        key={`editors-${quiz.quizId}`}
                    >
                        <div className="d-flex align-items-center me-3">
                            <i
                                className="bx bx-edit text-success me-1"
                                style={{fontSize: "16px"}}
                            ></i>
                            <span className="fw-medium">
                                {quiz.editors.length}
                            </span>
                        </div>
                        <div className="avatar-group">
                            {quiz.editors.slice(0, 3).map((user, index) => (
                                <img
                                    key={`${user.userId}-editor`}
                                    src={user.avatar || unknownAvatar}
                                    alt={user.name}
                                    className="rounded-circle border-2 border-white"
                                    width="28"
                                    height="28"
                                    title={user.name}
                                    style={{
                                        marginLeft: index === 0 ? 0 : "-8px",
                                        zIndex: 3 - index,
                                        position: "relative",
                                    }}
                                />
                            ))}
                            {quiz.editors.length > 3 && (
                                <span
                                    key={`editors-more-${quiz.quizId}`}
                                    className="avatar-more rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "28px",
                                        height: "28px",
                                        marginLeft: "-8px",
                                        fontSize: "0.7rem",
                                        border: "2px solid white",
                                        position: "relative",
                                    }}
                                >
                                    +{quiz.editors.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Start Game Session Button */}
                <button
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
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
                            Creating Session...
                        </>
                    ) : (
                        <>
                            <i
                                className="bx bx-play me-2"
                                style={{fontSize: "18px"}}
                            ></i>
                            Start Quiz
                            <i
                                className="bx bx-chevron-right ms-2"
                                style={{fontSize: "18px"}}
                            ></i>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// PropTypes for runtime validation (optional)
QuizSubCard.propTypes = {
    quiz: PropTypes.shape({
        quizId: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        host: PropTypes.shape({
            userId: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            avatar: PropTypes.string,
        }).isRequired,
        createdAt: PropTypes.string.isRequired,
        updatedAt: PropTypes.string.isRequired,
        status: PropTypes.oneOf(Object.values(GameStatus)).isRequired,
        viewers: PropTypes.arrayOf(
            PropTypes.shape({
                userId: PropTypes.string.isRequired,
                name: PropTypes.string.isRequired,
                avatar: PropTypes.string,
            }),
        ).isRequired,
        editors: PropTypes.arrayOf(
            PropTypes.shape({
                userId: PropTypes.string.isRequired,
                name: PropTypes.string.isRequired,
                avatar: PropTypes.string,
            }),
        ).isRequired,
    }).isRequired,
};

export default QuizSubCard;
