// QuizCard.tsx
import React from "react";

// Define TypeScript interfaces based on your Java model
interface User {
    username: string;
    avatarUrl?: string; // Optional since it wasn't in your original model
}

interface Quiz {
    quizId: string; // UUID will be string in TypeScript
    title: string;
    description?: string;
    host: User;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    status: "draft" | "live" | "completed"; // QuizStatus enum
    viewers: User[];
    editors: User[];
    comments?: number; // Optional, added for UI purposes
}

interface QuizCardProps {
    quiz?: Quiz;
}

const QuizCard: React.FC<QuizCardProps> = ({
    quiz = {
        quizId: crypto.randomUUID(),
        title: "New Quiz",
        description: "",
        host: {username: "Unknown Host"},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft",
        viewers: [],
        editors: [],
    },
}) => {
    // Format dates for display
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    };

    // Get editor avatars (taking first 3 for display)
    const editorAvatars: string[] = quiz.editors
        .slice(0, 3)
        .map(
            (editor) =>
                editor.avatarUrl || "../../assets/img/avatars/default.png",
        );

    return (
        <div className="row g-6">
            <div className="col-xl-12 col-lg-12 col-md-12">
                <div className="card h-100">
                    <div className="card-header pb-4">
                        <div className="d-flex align-items-start">
                            <div className="d-flex align-items-center">
                                <div className="avatar me-4">
                                    <img
                                        src={
                                            quiz.host.avatarUrl ||
                                            "/assets/img/avatars/unknown.jpgx"
                                        }
                                        alt="Host Avatar"
                                        className="rounded-circle"
                                    />
                                </div>
                                <div className="me-2">
                                    <h5 className="mb-0">
                                        <a
                                            href="#"
                                            className="stretched-link text-heading"
                                        >
                                            {quiz.title}
                                        </a>
                                    </h5>
                                    <div className="client-info text-body">
                                        <span className="fw-medium">
                                            Host:{" "}
                                        </span>
                                        <span>{quiz.host.username}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="ms-auto">
                                <div className="dropdown z-2">
                                    <button
                                        type="button"
                                        className="btn btn-icon btn-text-secondary rounded-pill dropdown-toggle hide-arrow p-0"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <i className="icon-base bx bx-dots-vertical-rounded icon-md text-body-secondary"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li>
                                            <a
                                                className="dropdown-item"
                                                href="#"
                                            >
                                                Edit quiz
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                className="dropdown-item"
                                                href="#"
                                            >
                                                View details
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                className="dropdown-item"
                                                href="#"
                                            >
                                                Change status
                                            </a>
                                        </li>
                                        <li>
                                            <hr className="dropdown-divider" />
                                        </li>
                                        <li>
                                            <a
                                                className="dropdown-item text-danger"
                                                href="#"
                                            >
                                                Delete quiz
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="bg-lighter px-3 py-2 rounded me-auto mb-4">
                                <p className="mb-1">
                                    <span className="fw-medium text-heading">
                                        {quiz.status.toUpperCase()}
                                    </span>
                                </p>
                                <span className="text-body">Quiz Status</span>
                            </div>
                            <div className="text-start mb-4">
                                <p className="mb-1">
                                    <span className="text-heading fw-medium">
                                        Created:{" "}
                                    </span>
                                    {formatDate(quiz.createdAt)}
                                </p>
                                <p className="mb-1">
                                    <span className="text-heading fw-medium">
                                        Updated:{" "}
                                    </span>
                                    {formatDate(quiz.updatedAt)}
                                </p>
                            </div>
                        </div>
                        <p className="mb-0">
                            {quiz.description || "No description available"}
                        </p>
                    </div>

                    <div className="card-body border-top">
                        <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center">
                                <ul className="list-unstyled d-flex align-items-center avatar-group mb-0 z-2">
                                    {editorAvatars.map((src, index) => (
                                        <li
                                            key={index}
                                            data-bs-toggle="tooltip"
                                            data-popup="tooltip-custom"
                                            data-bs-placement="top"
                                            title={
                                                quiz.editors[index]?.username ||
                                                `Editor ${index + 1}`
                                            }
                                            className="avatar avatar-sm pull-up"
                                        >
                                            <img
                                                className="rounded-circle"
                                                src={src}
                                                alt="Editor Avatar"
                                            />
                                        </li>
                                    ))}
                                    <li>
                                        <small className="text-body-secondary">
                                            {quiz.editors.length} Editors /{" "}
                                            {quiz.viewers.length} Viewers
                                        </small>
                                    </li>
                                </ul>
                            </div>
                            <div className="ms-auto">
                                <a
                                    href="#"
                                    className="text-body-secondary d-flex align-items-center"
                                >
                                    <i className="icon-base bx bx-chat me-1"></i>
                                    {quiz.comments || 0}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizCard;
