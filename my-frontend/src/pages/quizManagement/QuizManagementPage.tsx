import React, { useEffect, useState, useCallback } from "react";
import { notification, Pagination } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getPagedQuestionsByQuizId,
  getQuizById,
  publishedQuiz,
  saveQuizForMe,
} from "@/services/quizService";
import { Question, Quiz } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";
import QuestionList from "@/components/layouts/question/QuestionList";

const QuizManagementPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | undefined>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswers, setShowAnswers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const user = useAuthStore((s) => s.user);
  const currentUserId = (user as any)?.userId || (user as any)?.id;

  const quizOwnerId =
    (quiz as any)?.host?.userId ||
    (quiz as any)?.host?.id ||
    (quiz as any)?.hostId ||
    (quiz as any)?.ownerId;

  const isOwner = Boolean(currentUserId && quizOwnerId && currentUserId === quizOwnerId);

  const fetchQuestions = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await getPagedQuestionsByQuizId(quizId, page, size);
      setQuestions(data.content ?? []);
      setTotal(data.totalElements ?? 0);
    } catch (error) {
      console.error("Error fetching questions:", error);
      notification.error({
        message: "Error",
        description: "Unable to load the question list.",
      });
    } finally {
      setLoading(false);
    }
  }, [quizId, page, size]);

  const fetchQuizInfo = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await getQuizById(quizId);
      setQuiz(data);
    } catch (error) {
      console.error("Error fetching quiz info:", error);
      notification.error({
        message: "Error",
        description: "Unable to load quiz information.",
      });
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuizInfo();
  }, [fetchQuizInfo]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handlePublish = async () => {
    if (!quizId) return;
    setPublishing(true);
    try {
      await publishedQuiz(quizId);
      notification.success({
        message: "Success",
        description: "The quiz has been published successfully!",
      });
      fetchQuizInfo();
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to publish the quiz!",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveForMe = async () => {
    if (!quizId) return;
    setSaving(true);
    try {
      await saveQuizForMe(quizId);
      notification.success({
        message: "Success",
        description: "The quiz has been saved to your library!",
      });
    } catch (e) {
      notification.error({
        message: "Error",
        description: "Unable to save the quiz. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onPageChange = (p: number, pageSize?: number) => {
    const newSize = pageSize ?? size;
    if (newSize !== size) {
      setSize(newSize);
      setPage(0);
    } else {
      setPage(p - 1);
    }
  };

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
                      quiz?.status === "PUBLISHED"
                        ? "var(--success-color)"
                        : "var(--warning-color)"
                    }`,
                    color:
                      quiz?.status === "PUBLISHED"
                        ? "var(--success-color)"
                        : "var(--warning-color)",
                    backgroundColor: "transparent",
                  }}
                >
                  {quiz?.status === "PUBLISHED" ? "Published" : "Draft"}
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
                  {(quiz as any)?.host?.name ?? quizOwnerId ?? "Unknown"}
                </strong>{" "}
                {quiz?.description && `• ${quiz.description}`}
              </p>
            </div>

            {/* Right Actions */}
            {isOwner ? (
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
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
                >
                  ↩ Undo
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
                  disabled={publishing || quiz?.status === "PUBLISHED"}
                  style={{
                    padding: "0.6rem 1.2rem",
                    border: "none",
                    borderRadius: "10px",
                    background: "var(--gradient-primary)",
                    color: "white",
                    fontWeight: 600,
                    cursor:
                      publishing || quiz?.status === "PUBLISHED"
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      publishing || quiz?.status === "PUBLISHED" ? 0.5 : 1,
                    transition: "all 0.25s ease",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      !publishing &&
                      quiz?.status !== "PUBLISHED"
                    ) {
                      e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {publishing ? (
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
                      Publishing
                    </>
                  ) : (
                    <>
                      <span>⬆</span>
                      Publish
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveForMe}
                disabled={saving}
                style={{
                  padding: "0.6rem 1.2rem",
                  border: "2px solid var(--primary-color)",
                  borderRadius: "10px",
                  background: "transparent",
                  color: "var(--primary-color)",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.5 : 1,
                  transition: "all 0.25s ease",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = "var(--primary-color)";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--primary-color)";
                }}
              >
                {saving ? "Saving..." : "💾 Save for me"}
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        <QuestionList
          questions={questions}
          loading={loading}
          showAnswers={showAnswers}
          onToggleShowAnswers={() => setShowAnswers(!showAnswers)}
          total={total}
          page={page}
          size={size}
          onPageChange={(p, s) => {
            setPage(p);
            setSize(s);
          }}
        />

        {/* Draft Warning */}
        {quiz?.status === "DRAFT" && (
          <div
            style={{
              background: "var(--surface-alt)",
              border: `2px solid var(--warning-color)`,
              borderRadius: "10px",
              padding: "1rem",
              marginTop: "2rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                color: "var(--text-color)",
                marginBottom: "0.5rem",
              }}
            >
              ⚠ This is a draft activity
            </p>
            <p
              style={{
                margin: 0,
                color: "var(--text-light)",
                fontSize: "14px",
              }}
            >
              Publish this activity to share it with your students.
            </p>
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