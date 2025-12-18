// src/pages/QuestionCreatePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Spin, Empty, message } from "antd";
import { QuestionType, QuestionRequestDTO, addQuestion } from "@/services/questionService";
import QuestionForm from "@/components/forms/QuestionForm";

const DEFAULT_QUESTION_TYPE = QuestionType.SINGLE_CHOICE;

const QuestionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams<{ quizId: string }>();

  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const typeParam = searchParams.get("type");

    let selectedType = DEFAULT_QUESTION_TYPE;
    if (typeParam && Object.values(QuestionType).includes(typeParam as QuestionType)) {
      selectedType = typeParam as QuestionType;
    }

    setQuestionType(selectedType);
    setLoading(false);
  }, [location.search]);

  // ĐÚNG: Tạo payload theo chuẩn QuestionRequestDTO + image riêng
  const handleCreateQuestion = async (
    formData: any,
    imageFile?: File
  ) => {
    if (!quizId) {
      message.error("Không tìm thấy Quiz ID");
      return;
    }

    setSubmitting(true);

    try {
      const request: QuestionRequestDTO = {
        quizId,
        questionText: formData.questionText,
        questionType: formData.questionType,
        timeLimitSeconds: formData.timeLimitSeconds,
        points: formData.points,
        explanation: formData.explanation,
        hint: formData.hint,
        difficulty: formData.difficulty,
        tags: formData.tags,
        shuffleOptions: formData.shuffleOptions ?? true,
        options: formData.options || [],
      };

      await addQuestion(request, imageFile);

      message.success("Tạo câu hỏi thành công!");
      
      // Xóa draft sau khi tạo thành công
      localStorage.removeItem(`draft_question_${quizId}`);

      navigate(`/quiz/${quizId}/edit`, {
        state: { createdQuestion: true },
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Tạo câu hỏi thất bại";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/quiz/${quizId}/edit`);
  };

  if (!quizId) {
    return <Empty description="Không tìm thấy Quiz ID" className="h-screen flex flex-col items-center justify-center" />;
  }

  if (loading) {
    return <Spin tip="Đang tải..." size="large" className="h-screen flex items-center justify-center" />;
  }

  return (
    <QuestionForm
      quizId={quizId}
      initialQuestionType={questionType || DEFAULT_QUESTION_TYPE}
      isCreateMode={true}
      loading={submitting}
      onSave={handleCreateQuestion}
      onCancel={handleCancel}
    />
  );
};

export default QuestionCreatePage;