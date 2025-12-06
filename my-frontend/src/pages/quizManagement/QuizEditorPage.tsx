import React, { useEffect, useState, useCallback } from "react";
import { notification, Spin } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import {
  getQuizById,
  publishQuiz,
  generateQuestionsByTopic,
  TopicGenerateRequest,
  addAiQuestionsToQuiz,
  QuizDetailResponse,
} from "@/services/quizService";
import {
  getQuestionsByQuiz,
  addAiQuestionsToQuiz as addQuestionsToQuiz,
  QuestionResponseDTO,
} from "@/services/questionService";

import QuestionEditorHeader from "@/components/headers/QuestionEditorHeader";
import QuestionEditorSidebar from "@/components/sidebars/QuestionEditorSidebar";
import AddQuestionByTypeModal from "@/components/modals/AddQuestionByTypeModal";
import AiSuggestionModal from "@/components/modals/AiSuggestionModal";
import TopicGenerateModal from "@/components/modals/TopicGenerateModal";

import QuizEditList from "./QuizEditList";

let clientKeyCounter = 0;

/**
 * Generate unique client key for questions
 */
function genIdFallback(): string {
  clientKeyCounter += 1;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `client_${timestamp}_${random}_${clientKeyCounter}`;
}

type WithClientKey<T> = T & { clientKey: string };

/**
 * Ensure all questions have a clientKey
 */
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

interface QuizEditorState {
  quiz: QuizDetailResponse | null;
  questions: WithClientKey<QuestionResponseDTO>[];
  loading: boolean;
  publishing: boolean;
  page: number;
  size: number;
  total: number;
  topicModalOpen: boolean;
  aiModalVisible: boolean;
  aiQuestions: any[];
  aiLoading: boolean;
  savingAi: boolean;
}

const QuizEditorPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<QuizEditorState>({
    quiz: null,
    questions: [],
    loading: true,
    publishing: false,
    page: 0,
    size: 10,
    total: 0,
    topicModalOpen: false,
    aiModalVisible: false,
    aiQuestions: [],
    aiLoading: false,
    savingAi: false,
  });

  const [showModal, setShowModal] = useState(false);

  /**
   * Fetch quiz details
   */
  const fetchQuiz = useCallback(async () => {
    if (!quizId) return;
    try {
      const data = await getQuizById(quizId);
      setState((prev) => ({ ...prev, quiz: data }));
    } catch (err) {
      console.error("Error fetching quiz:", err);
      notification.error({
        message: "Error",
        description: "Failed to load quiz details",
      });
    }
  }, [quizId]);

  /**
   * Fetch paginated questions for quiz
   */
  const fetchQuestions = useCallback(async () => {
    if (!quizId) return;

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await getQuestionsByQuiz(quizId, state.page, state.size);
      const content = Array.isArray(response?.content) ? response.content : [];
      const processed = withClientKey(
        content as QuestionResponseDTO[]
      );

      setState((prev) => ({
        ...prev,
        questions: processed,
        total: response?.totalElements ?? 0,
        loading: false,
      }));
    } catch (err) {
      console.error("Error fetching questions:", err);
      notification.error({
        message: "Error",
        description: "Unable to load the question list",
      });
      setState((prev) => ({
        ...prev,
        questions: [],
        total: 0,
        loading: false,
      }));
    }
  }, [quizId, state.page, state.size]);

  /**
   * Initial load - fetch quiz info
   */
  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  /**
   * Fetch questions when page/size changes
   */
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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
        description: "Quiz published successfully!",
      });
      fetchQuiz();
    } catch (err) {
      notification.error({
        message: "Error",
        description: "Failed to publish quiz",
      });
    } finally {
      setState((prev) => ({ ...prev, publishing: false }));
    }
  };

  /**
   * Handle pagination change
   */
  const handlePageChange = (nextPage: number, nextSize: number) => {
    if (nextSize !== state.size) {
      setState((prev) => ({
        ...prev,
        page: 0,
        size: nextSize,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        page: nextPage,
      }));
    }
  };

  /**
   * Close AI modal
   */
  const handleCloseAiModal = useCallback(() => {
    if (state.savingAi) return;

    setState((prev) => ({
      ...prev,
      aiModalVisible: false,
    }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        aiQuestions: [],
        topicModalOpen: false,
      }));
    }, 300);
  }, [state.savingAi]);

  /**
   * Handle add similar questions
   */
  const handleAddSimilar = () => {
    setState((prev) => ({
      ...prev,
      aiQuestions: [],
      aiModalVisible: false,
      topicModalOpen: true,
    }));
  };

  /**
   * Handle generate questions by topic
   */
  const handleSubmitTopic = async (payload: TopicGenerateRequest) => {
    setState((prev) => ({ ...prev, aiLoading: true }));
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
        throw {
          __isEmptyAI: true,
          message: "No valid questions generated",
        };
      }

      setState((prev) => ({
        ...prev,
        aiQuestions: validQuestions,
        aiModalVisible: true,
        topicModalOpen: false,
      }));
    } catch (e: any) {
      const status = e?.__status;
      const isEmpty = e?.__isEmptyAI;
      let description = "Unable to generate questions from AI";

      if (status === 503 || status === 429) {
        description =
          "AI system is busy. Please try again in a few seconds.";
      } else if (isEmpty) {
        description =
          "AI returned empty or invalid format. Be more specific or reduce question count.";
      } else if (e?.message) {
        description = e.message;
      }

      notification.error({ message: "Error", description });
    } finally {
      setState((prev) => ({ ...prev, aiLoading: false }));
    }
  };

  /**
   * Handle accept and save AI questions
   */
  const handleAcceptAiQuestions = async (selected: any[]) => {
    if (!quizId) return;

    if (!Array.isArray(selected) || selected.length === 0) {
      setState((prev) => ({
        ...prev,
        aiModalVisible: false,
      }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          aiQuestions: [],
        }));
      }, 300);
      return;
    }

    setState((prev) => ({ ...prev, savingAi: true }));
    try {
      // Use addAiQuestionsToQuiz from quizService which delegates to questionService
      const saved = await addAiQuestionsToQuiz(quizId, selected);

      if (!Array.isArray(saved)) {
        throw new Error("Invalid response from addAiQuestionsToQuiz");
      }

      const prepared = withClientKey(saved as QuestionResponseDTO[]);

      setState((prev) => ({
        ...prev,
        questions: [...prepared, ...prev.questions],
        total: prev.total + prepared.length,
        aiModalVisible: false,
        savingAi: false,
      }));

      notification.success({
        message: "Success",
        description: `Added ${prepared.length} questions to quiz`,
      });

      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          aiQuestions: [],
          aiLoading: false,
        }));
      }, 300);
    } catch (e: any) {
      console.error("❌ Error in handleAcceptAiQuestions:", e);

      setState((prev) => ({
        ...prev,
        savingAi: false,
      }));

      const status = e?.__status || e?.response?.status;
      let description =
        e?.message || "Error adding questions (bulk operation)";

      if (status === 400) {
        description =
          "Invalid data. Check question/answer format.";
      }
      if (status === 404) {
        description = "Quiz not found";
      }

      notification.error({ message: "Error", description });
      console.error("[AI] addAiQuestionsToQuiz error:", e);
    }
  };

  /**
   * Handle time limit change
   */
  const handleTimeChange = useCallback(
    (_quizId: string, questionId: string, timeLimit: number) => {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          const key = q.questionId ?? q.clientKey;
          if (key !== questionId) return q;
          return { ...q, timeLimitSeconds: timeLimit };
        }),
      }));
    },
    []
  );

  /**
   * Handle points change
   */
  const handlePointsChange = useCallback(
    (_quizId: string, questionId: string, points: number) => {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          const key = q.questionId ?? q.clientKey;
          if (key !== questionId) return q;
          return { ...q, points };
        }),
      }));
    },
    []
  );

  /**
   * Generate topic seed from quiz title/description/recent questions
   */
  const topicSeed = (
    state.quiz?.title?.trim() ||
    state.quiz?.description?.trim() ||
    state.questions
      .slice(-3)
      .map((q) => q.questionText)
      .filter(Boolean)
      .join("; ") ||
    ""
  ).substring(0, 200); // Limit to 200 chars

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
        onBack={() => navigate(`/quiz/${quizId}`)}
        onPublish={handlePublish}
        publishing={state.publishing}
      />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        {state.loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Spin tip="Loading quiz..." />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 3fr",
              gap: "2rem",
              alignItems: "start",
            }}
          >
            <QuestionEditorSidebar />
            <QuizEditList
              quizId={quizId ?? ""}
              questions={state.questions}
              loading={state.loading}
              page={state.page}
              size={state.size}
              total={state.total}
              onPageChange={handlePageChange}
              onAddQuestion={() => setShowModal(true)}
              onTimeChange={handleTimeChange}
              onPointsChange={handlePointsChange}
              onAddSimilar={handleAddSimilar}
              aiLoading={state.aiLoading || state.savingAi}
            />
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      <AddQuestionByTypeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onAddQuestion={(type) => {
          setShowModal(false);
          navigate(`/quiz/${quizId}/questions/create?type=${type}`);
        }}
      />

      {/* Topic Generate Modal */}
      <TopicGenerateModal
        open={state.topicModalOpen}
        loading={state.aiLoading}
        onCancel={() =>
          setState((prev) => ({
            ...prev,
            topicModalOpen: false,
          }))
        }
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

      {/* AI Suggestion Modal */}
      <AiSuggestionModal
        show={state.aiModalVisible}
        loading={state.aiLoading || state.savingAi}
        questions={state.aiQuestions}
        onClose={handleCloseAiModal}
        onAccept={handleAcceptAiQuestions}
      />
    </div>
  );
};

export default QuizEditorPage;