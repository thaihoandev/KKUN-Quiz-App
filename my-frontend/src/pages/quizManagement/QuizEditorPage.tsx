import React, { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { notification } from "antd";
import { useParams, useNavigate } from "react-router-dom";

import {
  getPagedQuestionsByQuizId,
  publishedQuiz,
} from "@/services/quizService";
import QuestionEditorHeader from "@/components/headers/QuestionEditorHeader";
import QuestionEditorSidebar from "@/components/sidebars/QuestionEditorSidebar";
import AddQuestionByTypeModal from "@/components/modals/AddQuestionByTypeModal";
import { Question } from "@/interfaces";
import QuestionEditList from "./QuizEditList";

const QuizEditorPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // pagination state
  const [page, setPage] = useState<number>(0);   // 0-based
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

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

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleTimeChange = (quizId: string, questionId: string, time: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.questionId === questionId ? { ...q, timeLimit: time } : q)),
    );
  };

  const handlePointsChange = (quizId: string, questionId: string, points: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.questionId === questionId ? { ...q, points } : q)),
    );
  };

  // chọn loại câu hỏi -> navigate đến trang tạo câu hỏi
  const handleQuestionTypeSelection = (type: string) => {
    if (!quizId) return;
    setShowModal(false);
    navigate(`/quizzes/${quizId}/questions/create?type=${type}`);
  };

  const handlePublish = async () => {
    if (!quizId) return;
    setPublishing(true);
    try {
      await publishedQuiz(quizId);
      notification.success({
        message: "Success",
        description: "The quiz has been published successfully!",
      });
      // (tuỳ ý) navigate về trang quiz
      // navigate(`/quizzes/${quizId}`);
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to publish the quiz!",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleBack = () => {
    navigate(`/quizzes/${quizId}`);
  };

  const onPageChange = (nextPage0: number, nextSize: number) => {
    // nếu đổi size -> reset về trang đầu
    if (nextSize !== size) {
      setSize(nextSize);
      setPage(0);
    } else {
      setPage(nextPage0);
    }
  };

  return (
    <div className="container-fluid bg-light" style={{ minHeight: "100vh" }}>
      <QuestionEditorHeader
        onBack={handleBack}
        onPublish={handlePublish}
        publishing={publishing}
      />

      <div className="container py-4">
        <div className="row">
          <QuestionEditorSidebar />

          <QuestionEditList
            quizId={quizId ?? ""}
            questions={questions}
            loading={loading}
            page={page}
            size={size}
            total={total}
            onPageChange={onPageChange}
            onAddQuestion={() => setShowModal(true)}
            onTimeChange={handleTimeChange}
            onPointsChange={handlePointsChange}
          />
        </div>
      </div>

      <AddQuestionByTypeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onAddQuestion={handleQuestionTypeSelection}
      />
    </div>
  );
};

export default QuizEditorPage;
