import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { notification } from "antd";

import {
  getQuestionsByQuizId,
  getQuizzById,
  publishedQuiz,
  saveQuizForMe,
} from "@/services/quizService";
import QuestionCard from "@/components/cards/QuestionCard";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Question, Quiz } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";

interface Option {
  optionId: string;
  optionText: string;
  correct: boolean;
  correctAnswer: string;
}

const QuizManagementPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | undefined>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswers, setShowAnswers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Lấy current user từ store
  const { user } = useAuthStore();
  const currentUserId = user?.userId || (user as any)?.id;

  // Tính owner linh hoạt theo nhiều cấu trúc có thể có trên quiz
  const quizOwnerId =
    (quiz as any)?.host?.userId ||
    (quiz as any)?.host?.id ||
    (quiz as any)?.hostId ||
    (quiz as any)?.ownerId;

  const isOwner = Boolean(currentUserId && quizOwnerId && currentUserId === quizOwnerId);

  const fetchQuestions = async () => {
    if (!quizId) return;

    setLoading(true);
    try {
      const data = await getQuestionsByQuizId(quizId);
      setQuestions(data ?? []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
    setLoading(false);
  };

  const fetchQuizInfo = async () => {
    if (!quizId) return;

    setLoading(true);
    try {
      const data = await getQuizzById(quizId);
      setQuiz(data);
    } catch (error) {
      console.error("Error fetching quiz info:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizInfo();
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const handlePublish = async () => {
    if (!quizId) return;
    setPublishing(true);
    try {
      await publishedQuiz(quizId);
      notification.success({
        message: "Thành công",
        description: "Quiz đã được publish thành công!",
      });
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể publish quiz!",
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
        message: "Thành công",
        description: "Đã lưu hoạt động vào thư viện của bạn!",
      });
    } catch (e) {
      notification.error({
        message: "Lỗi",
        description: "Không thể lưu hoạt động. Vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
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
              {quiz?.host?.name ?? quizOwnerId ?? "Unknown"} • {quiz?.description}
            </p>
          </div>

          {/* CHỈ hiển thị khi là chủ sở hữu */}
          {isOwner ? (
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary">
                ↩ Undo
              </button>
              <Link
                to={`/quizzes/${quizId}/edit`}
                className="btn btn-outline-primary"
              >
                ✏ Edit
              </Link>
              <button
                onClick={handlePublish}
                className="btn btn-primary btn-sm"
                disabled={publishing || quiz?.status === "PUBLISHED"}
              >
                {publishing ? (
                  <>
                    <i className="bx bx-loader bx-spin"></i>{" "}
                    Publishing
                  </>
                ) : (
                  <>
                    <i className="bx bx-cloud-upload"></i>{" "}
                    Publish
                  </>
                )}
              </button>
            </div>
          ): (
            // KHÔNG phải chủ sở hữu: chỉ hiện 1 nút "Lưu về của tôi"
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

      <div className="card shadow-sm p-3 mt-2">
        <div className="d-flex justify-content-between align-items-center p-2">
          <h6 className="fw-bold mb-0">
            {questions.length} QUESTIONS
          </h6>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              checked={showAnswers}
              onChange={() => setShowAnswers(!showAnswers)}
            />
            <label className="form-check-label ms-2 fw-bold">
              Show Answers
            </label>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted">
            Loading questions...
          </p>
        ) : (
          questions.map((question, index) => (
            <QuestionCard
              key={question.questionId}
              question={question}
              index={index}
              showAnswers={showAnswers}
            />
          ))
        )}
      </div>

      <div className="alert alert-light border mt-3">
        <span className="fw-bold">⚠ This is a draft activity</span>
        <p className="mb-0 text-muted">
          Publish this activity to share it with your students.
        </p>
      </div>
    </div>
  );
};

export default QuizManagementPage;
