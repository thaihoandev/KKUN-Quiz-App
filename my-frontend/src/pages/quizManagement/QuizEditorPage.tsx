import React, { useEffect, useState, useCallback } from "react";
import { notification } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPagedQuestionsByQuizId,
  getQuizById,
  publishedQuiz,
  generateQuestionsByTopic,
  TopicGenerateRequest,
  addAiQuestionsToQuiz,
} from "@/services/quizService";

import QuestionEditorHeader from "@/components/headers/QuestionEditorHeader";
import QuestionEditorSidebar from "@/components/sidebars/QuestionEditorSidebar";
import AddQuestionByTypeModal from "@/components/modals/AddQuestionByTypeModal";
import AiSuggestionModal from "@/components/modals/AiSuggestionModal";
import TopicGenerateModal from "@/components/modals/TopicGenerateModal";

import { Question, Quiz } from "@/interfaces";
import QuizEditList from "./QuizEditList";

let clientKeyCounter = 0;

function genIdFallback() {
  clientKeyCounter += 1;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `client_${timestamp}_${random}_${clientKeyCounter}`;
}

type WithClientKey<T> = T & { clientKey: string };

function withClientKey<T extends { questionId?: string; clientKey?: string }>(
  arr: T[]
): WithClientKey<T>[] {
  if (!Array.isArray(arr)) return [];

  return arr.map((q) => {
    if (q.clientKey && typeof q.clientKey === "string") {
      return { ...q } as WithClientKey<T>;
    }

    if (q.questionId) {
      return { ...q, clientKey: String(q.questionId) } as WithClientKey<T>;
    }

    return { ...q, clientKey: genIdFallback() } as WithClientKey<T>;
  });
}

const QuizEditorPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<WithClientKey<Question>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [savingAi, setSavingAi] = useState(false);

  const fetchQuiz = useCallback(async () => {
    if (!quizId) return;
    try {
      const data = await getQuizById(quizId);
      setQuiz(data ?? null);
    } catch (err) {
      console.error("Error fetching quiz:", err);
    }
  }, [quizId]);

  const fetchQuestions = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await getPagedQuestionsByQuizId(quizId, page, size);

      const content = Array.isArray(data?.content) ? data.content : [];
      const processed = withClientKey(content as Question[]);

      setQuestions(processed);
      setTotal(data?.totalElements ?? 0);
    } catch (err) {
      console.error("Error fetching questions:", err);
      notification.error({
        message: "Error",
        description: "Unable to load the question list.",
      });
      setQuestions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [quizId, page, size]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

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
    } catch (err) {
      notification.error({
        message: "Error",
        description: "Failed to publish the quiz!",
      });
    } finally {
      setPublishing(false);
    }
  };

  const onPageChange = (nextPage0: number, nextSize: number) => {
    if (nextSize !== size) {
      setSize(nextSize);
      setPage(0);
    } else {
      setPage(nextPage0);
    }
  };

  const handleCloseAiModal = useCallback(() => {
    if (savingAi) return;

    setAiModalVisible(false);
    setTimeout(() => {
      setAiQuestions([]);
      setTopicModalOpen(false);
    }, 300);
  }, [savingAi]);

  const handleAddSimilar = () => {
    setAiQuestions([]);
    setAiModalVisible(false);
    setTopicModalOpen(true);
  };

  const handleSubmitTopic = async (payload: TopicGenerateRequest) => {
    setAiLoading(true);
    try {
      const req = {
        ...payload,
        ...(quizId ? { quizId } : {}),
        dedupe: true,
      } as TopicGenerateRequest;

      const generated = await generateQuestionsByTopic(req);

      if (!Array.isArray(generated)) {
        throw new Error("Invalid AI response format");
      }

      const validQuestions = generated.filter((q, idx) => {
        const isValid = q && typeof q === "object" && q.questionText;
        if (!isValid) {
          console.warn(`⚠️ Question #${idx} is invalid:`, q);
        }
        return isValid;
      });

      if (validQuestions.length === 0) {
        throw { __isEmptyAI: true, message: "No valid questions generated" };
      }

      setAiQuestions(validQuestions);
      setAiModalVisible(true);
      setTopicModalOpen(false);
    } catch (e: any) {
      const status = e?.__status;
      const isEmpty = e?.__isEmptyAI;
      let description = "Không thể sinh câu hỏi từ AI!";

      if (status === 503 || status === 429) {
        description =
          "Hệ thống AI đang bận (503/429). Vui lòng thử lại sau vài giây.";
      } else if (isEmpty) {
        description =
          "AI trả về rỗng hoặc sai định dạng. Hãy cụ thể hơn chủ đề hoặc giảm số câu.";
      } else if (e?.message) {
        description = e.message;
      }

      notification.error({ message: "Error", description });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAiQuestions = async (selected: Question[]) => {
    if (!quizId) return;

    if (!Array.isArray(selected) || selected.length === 0) {
      setAiModalVisible(false);
      setTimeout(() => setAiQuestions([]), 300);
      return;
    }

    setSavingAi(true);
    try {
      const saved = await addAiQuestionsToQuiz(quizId, selected);

      if (!Array.isArray(saved)) {
        throw new Error("Invalid response from addAiQuestionsToQuiz");
      }

      const prepared = withClientKey(saved as Question[]);

      setQuestions((prev) => {
        const updated = [...prepared, ...prev];
        return updated;
      });

      setTotal((prev) => {
        const newTotal = prev + prepared.length;
        return newTotal;
      });

      notification.success({
        message: "Đã thêm",
        description: `Đã lưu ${prepared.length} câu hỏi vào quiz`,
      });

      setAiModalVisible(false);
      setSavingAi(false);

      setTimeout(() => {
        setAiQuestions([]);
        setAiLoading(false);
      }, 300);
    } catch (e: any) {
      console.error("❌ Error in handleAcceptAiQuestions:", e);
      setSavingAi(false);

      const status = e?.__status || e?.response?.status;
      let description = e?.message || "Lỗi khi thêm câu hỏi (bulk).";

      if (status === 400) {
        description = "Dữ liệu không hợp lệ. Kiểm tra lại dạng câu hỏi/đáp án.";
      }
      if (status === 404) {
        description = "Quiz không tồn tại.";
      }

      notification.error({ message: "Error", description });
      console.error("[AI] addAiQuestionsToQuiz error:", e);
    }
  };

  const handleTimeChange = useCallback(
    (_qz: any, qidOrKey: string, t: number) => {
      setQuestions((prev) =>
        prev.map((q) => {
          const key = q.questionId ?? q.clientKey;
          if (key !== qidOrKey) return q;

          return { ...q, timeLimit: t };
        })
      );
    },
    []
  );

  const handlePointsChange = useCallback(
    (_qz: any, qidOrKey: string, p: number) => {
      setQuestions((prev) =>
        prev.map((q) => {
          const key = q.questionId ?? q.clientKey;
          if (key !== qidOrKey) return q;

          return { ...q, points: p };
        })
      );
    },
    []
  );

  const fallbackSeedFromQuestions = questions
    .slice(-3)
    .map((q) => q.questionText)
    .filter(Boolean)
    .join("; ");

  const topicSeed =
    (quiz?.title?.trim() || "") ||
    (quiz?.description?.trim() || "") ||
    fallbackSeedFromQuestions ||
    "";

  return (
    <div
      style={{
        background: "var(--background-color)",
        color: "var(--text-color)",
        minHeight: "100vh",
        transition: "background-color 0.4s ease, color 0.4s ease",
      }}
    >
      <QuestionEditorHeader
        onBack={() => navigate(`/quizzes/${quizId}`)}
        onPublish={handlePublish}
        publishing={publishing}
      />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 3fr",
            gap: "2rem",
            alignItems: "start",
            justifyItems: "center",
          }}
        >
          <QuestionEditorSidebar />
          <QuizEditList
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
            onAddSimilar={handleAddSimilar}
            aiLoading={aiLoading || savingAi}
          />
        </div>
      </div>

      <AddQuestionByTypeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onAddQuestion={(type) => {
          setShowModal(false);
          navigate(`/quizzes/${quizId}/questions/create?type=${type}`);
        }}
      />

      <TopicGenerateModal
        open={topicModalOpen}
        loading={aiLoading}
        onCancel={() => setTopicModalOpen(false)}
        initial={{
          topic: topicSeed,
          count: 5,
          questionType: "AUTO",
          timeLimit: 10,
          points: 1000,
          language: "vi",
        }}
        onSubmit={handleSubmitTopic}
      />

      <AiSuggestionModal
        show={aiModalVisible}
        loading={aiLoading || savingAi}
        questions={aiQuestions}
        onClose={handleCloseAiModal}
        onAccept={handleAcceptAiQuestions}
      />
    </div>
  );
};

export default QuizEditorPage;