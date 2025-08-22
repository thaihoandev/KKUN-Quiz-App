import React, { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { notification, Pagination } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getPagedQuestionsByQuizId,
  getQuizzById,
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

  // pagination state
  const [page, setPage] = useState<number>(0);       // 0-based for backend
  const [size, setSize] = useState<number>(10);      // page size
  const [total, setTotal] = useState<number>(0);     // totalElements from backend

  // current user
  const user = useAuthStore((s) => s.user);
  const currentUserId = (user as any)?.userId || (user as any)?.id;

  // compute owner
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
      const data = await getQuizzById(quizId);
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

  // Antd Pagination is 1-based; backend is 0-based
  const onPageChange = (p: number, pageSize?: number) => {
    const newSize = pageSize ?? size;
    // if user changed page size, reset to first page
    if (newSize !== size) {
      setSize(newSize);
      setPage(0);
    } else {
      setPage(p - 1);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm rounded-3 p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold d-flex align-items-center">
              {quiz?.title || "Loading..."}
              <span
                className="badge bg-transparent border border-secondary text-secondary rounded mx-2"
                style={{ fontSize: "0.75rem" }}
              >
                {quiz?.status === "PUBLISHED" ? "Published" : "Draft"}
              </span>
            </h4>
            <p className="text-muted mb-1">
              {(quiz as any)?.host?.name ?? quizOwnerId ?? "Unknown"} • {quiz?.description}
            </p>
          </div>

          {isOwner ? (
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary">↩ Undo</button>
              <Link to={`/quizzes/${quizId}/edit`} className="btn btn-outline-primary">
                ✏ Edit
              </Link>
              <button
                onClick={handlePublish}
                className="btn btn-primary btn-sm"
                disabled={publishing || quiz?.status === "PUBLISHED"}
              >
                {publishing ? (
                  <>
                    <i className="bx bx-loader bx-spin"></i> Publishing
                  </>
                ) : (
                  <>
                    <i className="bx bx-cloud-upload"></i> Publish
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                onClick={handleSaveForMe}
                className="btn btn-outline-primary btn-sm"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save for me"}
              </button>
            </div>
          )}
        </div>
      </div>

      <QuestionList
        questions={questions}
        loading={loading}
        showAnswers={showAnswers}
        onToggleShowAnswers={() => setShowAnswers(!showAnswers)}
        total={total}
        page={page}
        size={size}
        onPageChange={(p, s) => {
          setPage(p);   // 0-based
          setSize(s);
        }}
      />

      {quiz?.status === "DRAFT" && (
        <div className="alert alert-light border mt-3">
          <span className="fw-bold">⚠ This is a draft activity</span>
          <p className="mb-0 text-muted">
            Publish this activity to share it with your students.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizManagementPage;
