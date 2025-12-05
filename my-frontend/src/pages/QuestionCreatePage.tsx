import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Spin, Empty, message } from "antd";
import { QuestionType } from "@/services/questionService";
import { addQuestion } from "@/services/questionService";
import QuestionForm from "@/components/forms/QuestionForm";

/**
 * Default question type
 */
const DEFAULT_QUESTION_TYPE = QuestionType.SINGLE_CHOICE;

/**
 * All available question types
 */
const AVAILABLE_QUESTION_TYPES = Object.values(QuestionType);

interface QuestionCreatePageState {
  questionType: QuestionType | null;
  loading: boolean;
  submitting: boolean;
}

const QuestionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams<{ quizId: string }>();

  const [state, setState] = useState<QuestionCreatePageState>({
    questionType: null,
    loading: true,
    submitting: false,
  });

  /**
   * Initialize question type from URL params
   */
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const typeParam = searchParams.get("type");

      let selectedType = DEFAULT_QUESTION_TYPE;

      if (
        typeParam &&
        AVAILABLE_QUESTION_TYPES.includes(typeParam as QuestionType)
      ) {
        selectedType = typeParam as QuestionType;
      }

      setState((prev) => ({
        ...prev,
        questionType: selectedType,
        loading: false,
      }));
    } catch (error) {
      console.error("Error initializing question type:", error);
      setState((prev) => ({
        ...prev,
        questionType: DEFAULT_QUESTION_TYPE,
        loading: false,
      }));
    }
  }, [location.search]);

  /**
   * Handle create question
   */
  const handleCreateQuestion = async (formData: FormData) => {
    if (!quizId) {
      message.error("Quiz ID not found");
      return;
    }

    setState((prev) => ({ ...prev, submitting: true }));

    try {
      // addQuestion expects FormData directly (with question JSON + optional image)
      await addQuestion(formData as any);

      message.success("Question created successfully!");

      navigate(`/quizzes/${quizId}/edit`, {
        state: { createdQuestion: true },
      });
    } catch (error: any) {
      console.error("Error creating question:", error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create question";

      message.error(errorMsg);
    } finally {
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  /**
   * Handle cancel - navigate back to edit page
   */
  const handleCancel = () => {
    navigate(`/quizzes/${quizId}/edit`);
  };

  // Validation
  if (!quizId) {
    return (
      <Empty
        description="Quiz ID not found"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "var(--text-light)",
        }}
      />
    );
  }

  if (state.loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--background-color)",
        }}
      >
        <Spin tip="Loading question type..." size="large" />
      </div>
    );
  }

  if (!state.questionType) {
    return (
      <Empty
        description="Invalid question type"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "var(--text-light)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        background: "var(--background-color)",
        color: "var(--text-color)",
        minHeight: "100vh",
        transition: "background-color 0.4s ease, color 0.4s ease",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <QuestionForm
          quizId={quizId}
          onSave={handleCreateQuestion}
          onCancel={handleCancel}
          isCreateMode={true}
          initialQuestionType={state.questionType}
          loading={state.submitting}
        />
      </div>
    </div>
  );
};

export default QuestionCreatePage;