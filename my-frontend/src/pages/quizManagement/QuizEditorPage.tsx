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

// ✅ FIX 1: Sử dụng counter để đảm bảo unique key
let clientKeyCounter = 0;

function genIdFallback() {
  clientKeyCounter += 1;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `client_${timestamp}_${random}_${clientKeyCounter}`;
}

type WithClientKey<T> = T & { clientKey: string };

// ✅ FIX 2: Không mutate object gốc - tạo shallow copy
function withClientKey<T extends { questionId?: string; clientKey?: string }>(
  arr: T[]
): WithClientKey<T>[] {
  if (!Array.isArray(arr)) return [];
  
  return arr.map((q) => {
    // Nếu đã có clientKey hợp lệ, giữ nguyên
    if (q.clientKey && typeof q.clientKey === 'string') {
      return { ...q } as WithClientKey<T>;
    }
    
    // Nếu có questionId, dùng làm clientKey
    if (q.questionId) {
      return { ...q, clientKey: String(q.questionId) } as WithClientKey<T>;
    }
    
    // Tạo mới clientKey
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

  // ✅ Debug: Log khi questions thay đổi
  React.useEffect(() => {
    console.log('📝 Questions state updated:', questions.length);
    if (questions.length > 0) {
      console.log('🔑 First 3 keys:', questions.slice(0, 3).map(q => 
        q.clientKey || q.questionId || 'NO_KEY'
      ));
    }
  }, [questions]);

  // pagination
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // AI form + preview
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // bulk saving
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
      
      // ✅ FIX 3: Validate data trước khi set
      const content = Array.isArray(data?.content) ? data.content : [];
      const processed = withClientKey(content as Question[]);
      
      setQuestions(processed);
      setTotal(data?.totalElements ?? 0);
    } catch (err) {
      console.error("Error fetching questions:", err);
      notification.error({ 
        message: "Error", 
        description: "Unable to load the question list." 
      });
      setQuestions([]); // Reset về empty array
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
        description: "The quiz has been published successfully!" 
      });
    } catch (err) {
      console.error("Error publishing quiz:", err);
      notification.error({ 
        message: "Error", 
        description: "Failed to publish the quiz!" 
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

  // ✅ FIX: Reset AI state hoàn toàn khi đóng modal
  const handleCloseAiModal = useCallback(() => {
    if (savingAi) return; // Không cho đóng khi đang save
    
    setAiModalVisible(false);
    // ✅ Delay để tránh flash UI
    setTimeout(() => {
      setAiQuestions([]);
      setTopicModalOpen(false);
    }, 300);
  }, [savingAi]);

  const handleAddSimilar = () => {
    // ✅ Reset state trước khi mở modal mới
    setAiQuestions([]);
    setAiModalVisible(false);
    setTopicModalOpen(true);
  };

  // ✅ FIX 4: Validate AI response trước khi set
  const handleSubmitTopic = async (payload: TopicGenerateRequest) => {
    setAiLoading(true);
    try {
      const req = {
        ...payload,
        ...(quizId ? { quizId } : {}),
        dedupe: true,
      } as TopicGenerateRequest;
      
      const generated = await generateQuestionsByTopic(req);
      
      // ✅ DEBUG: Log raw response
      console.log("🔍 AI Raw Response:", generated);
      console.log("🔍 Response type:", typeof generated);
      console.log("🔍 Is array:", Array.isArray(generated));
      
      // Validate response
      if (!Array.isArray(generated)) {
        console.error("❌ AI response is not an array:", generated);
        throw new Error("Invalid AI response format");
      }
      
      // Filter out invalid questions
      const validQuestions = generated.filter((q, idx) => {
        const isValid = q && typeof q === 'object' && q.questionText;
        if (!isValid) {
          console.warn(`⚠️ Question #${idx} is invalid:`, q);
        }
        return isValid;
      });
      
      console.log(`✅ Valid questions: ${validQuestions.length}/${generated.length}`);
      
      if (validQuestions.length === 0) {
        throw { __isEmptyAI: true, message: "No valid questions generated" };
      }
      
      // ✅ Log first question structure
      console.log("📋 Sample question structure:", JSON.stringify(validQuestions[0], null, 2));
      
      setAiQuestions(validQuestions);
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

  // ✅ FIX 5: Sử dụng functional update và reset state
  const handleAcceptAiQuestions = async (selected: Question[]) => {
    if (!quizId) return;
    
    console.log('🎯 handleAcceptAiQuestions called with:', selected.length, 'questions');
    
    if (!Array.isArray(selected) || selected.length === 0) {
      console.log('⚠️ No questions selected, closing modal');
      setAiModalVisible(false);
      // ✅ Clear ngay khi không có gì để thêm
      setTimeout(() => setAiQuestions([]), 300);
      return;
    }

    setSavingAi(true);
    try {
      console.log('📤 Sending to API:', selected);
      const saved = await addAiQuestionsToQuiz(quizId, selected);
      console.log('📥 API Response:', saved);
      
      // Validate saved data
      if (!Array.isArray(saved)) {
        throw new Error("Invalid response from addAiQuestionsToQuiz");
      }
      
      const prepared = withClientKey(saved as Question[]);
      console.log('✅ Prepared questions:', prepared.length);
      console.log('🔑 Sample clientKeys:', prepared.slice(0, 3).map(q => q.clientKey));
      
      // ✅ Sử dụng functional update để tránh race condition
      setQuestions(prev => {
        console.log('📊 Current questions:', prev.length);
        const updated = [...prepared, ...prev];
        console.log('📊 After merge:', updated.length);
        return updated;
      });
      
      setTotal(prev => {
        const newTotal = prev + prepared.length;
        console.log('📊 Total: ', prev, '→', newTotal);
        return newTotal;
      });

      notification.success({
        message: "Đã thêm",
        description: `Đã lưu ${prepared.length} câu hỏi vào quiz`,
      });
      
      console.log('🎉 Success! Closing modal...');
      
      // ✅ Reset state hoàn toàn
      setAiModalVisible(false);
      setSavingAi(false);
      
      // ✅ Delay clear để tránh flash
      setTimeout(() => {
        console.log('🧹 Clearing AI questions from state');
        setAiQuestions([]);
        setAiLoading(false);
      }, 300);
      
    } catch (e: any) {
      console.error('❌ Error in handleAcceptAiQuestions:', e);
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

  // ✅ FIX 6: Sử dụng immutable update cho time/points
  const handleTimeChange = useCallback((_qz: any, qidOrKey: string, t: number) => {
    setQuestions(prev => prev.map(q => {
      const key = q.questionId ?? q.clientKey;
      if (key !== qidOrKey) return q;
      
      // Tạo object mới thay vì mutate
      return { ...q, timeLimit: t };
    }));
  }, []);

  const handlePointsChange = useCallback((_qz: any, qidOrKey: string, p: number) => {
    setQuestions(prev => prev.map(q => {
      const key = q.questionId ?? q.clientKey;
      if (key !== qidOrKey) return q;
      
      // Tạo object mới thay vì mutate
      return { ...q, points: p };
    }));
  }, []);

  const fallbackSeedFromQuestions = questions
    .slice(-3)
    .map(q => q.questionText)
    .filter(Boolean)
    .join("; ");

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