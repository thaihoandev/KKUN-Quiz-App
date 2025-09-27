import React, { useEffect, useState, useCallback } from "react";
import { notification } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPagedQuestionsByQuizId,
  getQuizById,
  publishedQuiz,
  generateQuestionsByTopic,
  TopicGenerateRequest,
} from "@/services/quizService";

import QuestionEditorHeader from "@/components/headers/QuestionEditorHeader";
import QuestionEditorSidebar from "@/components/sidebars/QuestionEditorSidebar";
import AddQuestionByTypeModal from "@/components/modals/AddQuestionByTypeModal";
import AiSuggestionModal from "@/components/modals/AiSuggestionModal";
import TopicGenerateModal from "@/components/modals/TopicGenerateModal";

import { Question, Quiz } from "@/interfaces";
import QuizEditList from "./QuizEditList";

// ====== Key ổn định cho item không có questionId (ví dụ câu hỏi AI mới) ======
function genIdFallback() {
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
    return (crypto as any).randomUUID();
  }
  return `cid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Kiểu thống nhất: luôn có clientKey
type WithClientKey<T> = T & { clientKey: string };

// Đảm bảo phần tử nào cũng có clientKey (ưu tiên questionId)
function withClientKey<T extends { questionId?: string; clientKey?: string }>(
  arr: T[]
): WithClientKey<T>[] {
  return (arr ?? []).map((q) => ({
    ...q,
    clientKey: q.clientKey ?? q.questionId ?? genIdFallback(),
  })) as WithClientKey<T>[];
}

const QuizEditorPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<WithClientKey<Question>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // pagination
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // AI form + preview
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // ==== fetch quiz detail (title/description) ====
  const fetchQuiz = useCallback(async () => {
    if (!quizId) return;
    try {
      const data = await getQuizById(quizId);
      setQuiz(data ?? null);
    } catch {
      /* notification đã xử lý ở service (nếu có) */
    }
  }, [quizId]);

  // ==== fetch paged questions ====
  const fetchQuestions = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await getPagedQuestionsByQuizId(quizId, page, size);
      setQuestions(withClientKey(data.content as Question[]));
      setTotal(data.totalElements ?? 0);
    } catch {
      notification.error({ message: "Error", description: "Unable to load the question list." });
    } finally {
      setLoading(false);
    }
  }, [quizId, page, size]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  
  const handlePublish = async () => {
    if (!quizId) return;
    setPublishing(true);
    try {
      await publishedQuiz(quizId);
      notification.success({ message: "Success", description: "The quiz has been published successfully!" });
    } catch {
      notification.error({ message: "Error", description: "Failed to publish the quiz!" });
    } finally {
      setPublishing(false);
    }
  };

  const onPageChange = (nextPage0: number, nextSize: number) => {
    if (nextSize !== size) { setSize(nextSize); setPage(0); }
    else { setPage(nextPage0); }
  };

  // Mở form chọn TopicGenerateRequest
  const handleAddSimilar = () => setTopicModalOpen(true);

  // Submit form: gọi API sinh câu hỏi theo chủ đề → mở modal preview
  const handleSubmitTopic = async (payload: TopicGenerateRequest) => {
    setAiLoading(true);
    try {
      const generated = await generateQuestionsByTopic(payload);
      setAiQuestions(generated ?? []);
      setAiModalVisible(true);
      setTopicModalOpen(false);
    } catch (e: any) {
      const status = e?.__status;
      const isEmpty = e?.__isEmptyAI;
      let description = "Không thể sinh câu hỏi từ AI!";
      if (status === 503 || status === 429) {
        description = "Hệ thống AI đang bận (503/429). Vui lòng thử lại sau vài giây.";
      } else if (isEmpty) {
        description = "AI trả về rỗng hoặc sai định dạng. Hãy cụ thể hơn chủ đề hoặc giảm số câu.";
      } else if (e?.message) {
        description = e.message;
      }
      notification.error({ message: "Error", description });
      console.error("[AI] generateQuestionsByTopic error:", e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAiQuestions = (selected: Question[]) => {
    if (selected?.length) {
      const prepared = withClientKey(selected);
      setQuestions(prev => [...prev, ...prepared]);
      notification.success({ message: "Đã thêm", description: `Đã thêm ${selected.length} câu hỏi từ AI` });
    }
    setAiModalVisible(false);
  };

  // ==== topic seed ưu tiên từ quiz ====
  const fallbackSeedFromQuestions =
    questions.slice(-3).map(q => q.questionText).filter(Boolean).join("; ");

  const topicSeed =
    (quiz?.title?.trim() || "") ||
    (quiz?.description?.trim() || "") ||
    fallbackSeedFromQuestions ||
    "";

  return (
    <div className="container-fluid bg-light" style={{ minHeight: "100vh" }}>
      <QuestionEditorHeader
        onBack={() => navigate(`/quizzes/${quizId}`)}
        onPublish={handlePublish}
        publishing={publishing}
      />

      <div className="container py-4">
        <div className="row">
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
            onTimeChange={(_qz, qidOrKey, t) =>
              setQuestions(prev => prev.map(q => {
                const key = q.questionId ?? q.clientKey!;
                return key === qidOrKey ? { ...q, timeLimit: t } : q;
              }))
            }
            onPointsChange={(_qz, qidOrKey, p) =>
              setQuestions(prev => prev.map(q => {
                const key = q.questionId ?? q.clientKey!;
                return key === qidOrKey ? { ...q, points: p } : q;
              }))
            }
            onAddSimilar={handleAddSimilar}
            aiLoading={aiLoading}
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
          count: 5,           // server clamp tối đa 10
          questionType: "AUTO",
          timeLimit: 60,      // default 60s
          points: 1000,
          language: "vi",
        }}
        onSubmit={handleSubmitTopic}
      />

      <AiSuggestionModal
        show={aiModalVisible}
        loading={aiLoading}
        questions={aiQuestions}
        onClose={() => setAiModalVisible(false)}
        onAccept={handleAcceptAiQuestions}
      />
    </div>
  );
};

export default QuizEditorPage;
