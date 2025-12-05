import React, { useEffect, useState } from "react";
import { notification, Spin } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getQuizById,
  publishQuiz,
  QuizDetailResponse,
} from "@/services/quizService";
import { getQuestionsByQuiz as getQuestionsByQuizPaged } from "@/services/questionService";
import { QuestionResponseDTO } from "@/services/questionService";
import { useAuthStore } from "@/store/authStore";
import QuestionList from "@/components/layouts/question/QuestionList";

interface QuizPageState {
  quiz: QuizDetailResponse | undefined;
  questions: QuestionResponseDTO[];
  showAnswers: boolean;
  loading: boolean;
  publishing: boolean;
  total: number;
}

const QuizManagementPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<QuizPageState>({
    quiz: undefined,
    questions: [],
    showAnswers: true,
    loading: true,
    publishing: false,
    total: 0,
  });

  // ✅ Tách page/size ra khỏi state chính để tránh re-render loop
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const user = useAuthStore((s) => s.user);
  const currentUserId = (user as any)?.userId || (user as any)?.id;

  const isOwner =
    state.quiz?.isOwner ?? (state.quiz?.creator?.userId === currentUserId);

  /**
   * Fetch quiz details - chỉ chạy 1 lần khi mount
   */
  useEffect(() => {
    if (!quizId) return;

    const fetchQuizInfo = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const quiz = await getQuizById(quizId);
        setState((prev) => ({ ...prev, quiz }));
      } catch (error) {
        console.error("Error fetching quiz info:", error);
        notification.error({
          message: "Error",
          description: "Unable to load quiz information.",
        });
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchQuizInfo();
  }, [quizId]); // ✅ Chỉ phụ thuộc vào quizId

  /**
   * Fetch paginated questions - chạy khi page/size thay đổi
   */
  useEffect(() => {
    if (!quizId) return;

    const fetchQuestions = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await getQuestionsByQuizPaged(
          quizId,
          page,
          size
        );
        setState((prev) => ({
          ...prev,
          questions: response.content ?? [],
          total: response.totalElements ?? 0,
          loading: false, // ✅ Set loading false ngay khi có data
        }));
      } catch (error) {
        console.error("Error fetching questions:", error);
        notification.error({
          message: "Error",
          description: "Unable to load the question list.",
        });
        setState((prev) => ({ ...prev, loading: false })); // ✅ Set loading false khi error
      }
    };

    fetchQuestions();
  }, [quizId, page, size]); // ✅ Dependency là primitive values, không gây re-render loop

  /**
   * Handle publish quiz
   */
  const handlePublish = async () => {
    if (!quizId) return;

    setState((prev) => ({ ...prev, publishing: true }));
    try {
      await publishQuiz(quizId);
      notification.success({
        message: "Success",
        description: "The quiz has been published successfully!",
      });
      
      // Refresh quiz info
      const quiz = await getQuizById(quizId);
      setState((prev) => ({ ...prev, quiz }));
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to publish the quiz!",
      });
    } finally {
      setState((prev) => ({ ...prev, publishing: false }));
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (p: number, pageSize?: number) => {
    const newSize = pageSize ?? size;
    const newPage = pageSize ? 0 : p - 1;

    setSize(newSize);
    setPage(newPage);
  };

  /**
   * Toggle show/hide answers
   */
  const handleToggleShowAnswers = () => {
    setState((prev) => ({ ...prev, showAnswers: !prev.showAnswers }));
  };

  const quiz = state.quiz;
  const isPublished = quiz?.published === true;
  const isDraft = !isPublished;

  return (
    <div
      style={{
        background: "var(--background-color)",
        color: "var(--text-color)",
        minHeight: "100vh",
        transition: "background-color 0.4s ease, color 0.4s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        {/* Quiz Info Card */}
        <div
          style={{
            background: "var(--surface-color)",
            border: "none",
            borderRadius: "var(--border-radius)",
            overflow: "hidden",
            boxShadow: "var(--card-shadow)",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {/* Left Content */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "1.5rem",
                    color: "var(--text-color)",
                  }}
                >
                  {quiz?.title || "Loading..."}
                </h4>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: `2px solid ${
                      isPublished ? "var(--success-color)" : "var(--warning-color)"
                    }`,
                    color: isPublished
                      ? "var(--success-color)"
                      : "var(--warning-color)",
                    backgroundColor: "transparent",
                  }}
                >
                  {isPublished ? "Published" : "Draft"}
                </span>
              </div>

              <p
                style={{
                  margin: "0 0 0.5rem 0",
                  color: "var(--text-light)",
                  fontSize: "14px",
                }}
              >
                <strong style={{ color: "var(--text-color)" }}>
                  {quiz?.creator?.name ?? "Unknown"}
                </strong>
                {quiz?.description && ` • ${quiz.description}`}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  marginTop: "1rem",
                  fontSize: "14px",
                  color: "var(--text-light)",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <strong style={{ color: "var(--text-color)" }}>
                    {quiz?.totalQuestions ?? 0}
                  </strong>{" "}
                  Questions
                </span>
                <span>
                  <strong style={{ color: "var(--text-color)" }}>
                    {quiz?.difficulty ?? "MEDIUM"}
                  </strong>
                </span>
                <span>
                  <strong style={{ color: "var(--text-color)" }}>
                    {quiz?.estimatedMinutes ?? 0}
                  </strong>{" "}
                  mins
                </span>
                <span>
                  <strong style={{ color: "var(--text-color)" }}>
                    {quiz?.viewCount ?? 0}
                  </strong>{" "}
                  Views
                </span>
              </div>
            </div>

            {/* Right Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {isOwner ? (
                <>
                  <button
                    style={{
                      padding: "0.6rem 1.2rem",
                      border: "2px solid var(--border-color)",
                      borderRadius: "10px",
                      background: "transparent",
                      color: "var(--text-color)",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-alt)";
                      e.currentTarget.style.borderColor = "var(--text-color)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    }}
                    onClick={() => navigate(-1)}
                    title="Go back"
                  >
                    ← Back
                  </button>

                  <Link
                    to={`/quizzes/${quizId}/edit`}
                    style={{
                      padding: "0.6rem 1.2rem",
                      border: "2px solid var(--primary-color)",
                      borderRadius: "10px",
                      background: "transparent",
                      color: "var(--primary-color)",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "all 0.25s ease",
                      fontSize: "14px",
                      display: "inline-block",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-color)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--primary-color)";
                    }}
                  >
                    ✏ Edit
                  </Link>

                  <button
                    onClick={handlePublish}
                    disabled={state.publishing || isPublished}
                    style={{
                      padding: "0.6rem 1.2rem",
                      border: "none",
                      borderRadius: "10px",
                      background: "var(--gradient-primary)",
                      color: "white",
                      fontWeight: 600,
                      cursor:
                        state.publishing || isPublished
                          ? "not-allowed"
                          : "pointer",
                      opacity: state.publishing || isPublished ? 0.5 : 1,
                      transition: "all 0.25s ease",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      if (!state.publishing && !isPublished) {
                        e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {state.publishing ? (
                      <>
                        <span
                          style={{
                            display: "inline-block",
                            width: "16px",
                            height: "16px",
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            borderTop: "2px solid white",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <span>⬆</span>
                        Publish
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  style={{
                    padding: "0.6rem 1.2rem",
                    border: "2px solid var(--primary-color)",
                    borderRadius: "10px",
                    background: "transparent",
                    color: "var(--primary-color)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--primary-color)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }}
                  onClick={() => navigate(-1)}
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Questions List Section */}
        <div
          style={{
            background: "var(--surface-color)",
            border: "none",
            borderRadius: "var(--border-radius)",
            overflow: "hidden",
            boxShadow: "var(--card-shadow)",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--text-color)",
              }}
            >
              Questions ({state.total})
            </h3>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                color: "var(--text-light)",
                fontSize: "14px",
              }}
            >
              <input
                type="checkbox"
                checked={state.showAnswers}
                onChange={handleToggleShowAnswers}
                style={{ cursor: "pointer" }}
              />
              Show Answers
            </label>
          </div>

          {state.loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Spin tip="Loading questions..." />
            </div>
          ) : state.questions.length > 0 ? (
            <>
              <QuestionList
                questions={state.questions}
                loading={state.loading}
                showAnswers={state.showAnswers}
              />

              {/* Pagination */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "2rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <select
                    value={size}
                    onChange={(e) =>
                      handlePageChange(1, parseInt(e.target.value))
                    }
                    style={{
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--surface-color)",
                      color: "var(--text-color)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </select>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      disabled={page === 0}
                      onClick={() => handlePageChange(1)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        border: "1px solid var(--border-color)",
                        background: "var(--surface-alt)",
                        color: "var(--text-color)",
                        borderRadius: "6px",
                        cursor: page === 0 ? "not-allowed" : "pointer",
                        opacity: page === 0 ? 0.5 : 1,
                      }}
                    >
                      ←
                    </button>

                    <span
                      style={{
                        padding: "0.5rem 1rem",
                        color: "var(--text-light)",
                        fontSize: "14px",
                      }}
                    >
                      Page {page + 1} of{" "}
                      {Math.ceil(state.total / size) || 1}
                    </span>

                    <button
                      disabled={
                        page >=
                        Math.ceil(state.total / size) - 1
                      }
                      onClick={() => handlePageChange(page + 2)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        border: "1px solid var(--border-color)",
                        background: "var(--surface-alt)",
                        color: "var(--text-color)",
                        borderRadius: "6px",
                        cursor:
                          page >=
                          Math.ceil(state.total / size) - 1
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          page >=
                          Math.ceil(state.total / size) - 1
                            ? 0.5
                            : 1,
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "var(--text-light)",
              }}
            >
              <p>No questions yet. Add some questions to get started!</p>
              {isOwner && (
                <Link
                  to={`/quizzes/${quizId}/edit`}
                  style={{
                    color: "var(--primary-color)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Add Questions
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Draft Warning */}
        {isDraft && (
          <div
            style={{
              background: "var(--surface-alt)",
              border: `2px solid var(--warning-color)`,
              borderRadius: "10px",
              padding: "1.5rem",
              marginTop: "2rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                color: "var(--text-color)",
                marginBottom: "0.5rem",
                fontSize: "1rem",
              }}
            >
              ⚠ This is a draft quiz
            </p>
            <p
              style={{
                margin: 0,
                color: "var(--text-light)",
                fontSize: "14px",
                marginBottom: "1rem",
              }}
            >
              Publish this quiz to share it with others.
            </p>
            {isOwner && (
              <button
                onClick={handlePublish}
                disabled={state.publishing}
                style={{
                  padding: "0.6rem 1.2rem",
                  border: "none",
                  borderRadius: "10px",
                  background: "var(--gradient-primary)",
                  color: "white",
                  fontWeight: 600,
                  cursor: state.publishing ? "not-allowed" : "pointer",
                  opacity: state.publishing ? 0.5 : 1,
                  transition: "all 0.25s ease",
                  fontSize: "14px",
                }}
              >
                {state.publishing ? "Publishing..." : "Publish Now"}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default QuizManagementPage;