import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Empty, Spin, message } from "antd";
import {
  updateQuestion,
  getQuestionById,
  QuestionResponseDTO,
  QuestionRequestDTO,
} from "@/services/questionService";
import QuestionForm from "@/components/forms/QuestionForm";

interface QuestionEditorPageState {
  loading: boolean;
  submitting: boolean;
  question: QuestionResponseDTO | null;
  error: string | null;
}

const QuestionEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId, questionId } = useParams<{ quizId: string; questionId: string }>();
  
  // Get question from location state OR fetch from API
  const questionFromState = location.state?.question as QuestionResponseDTO | undefined;

  const [state, setState] = useState<QuestionEditorPageState>({
    loading: !questionFromState, // Only load if not from state
    submitting: false,
    question: questionFromState || null,
    error: null,
  });

  /**
   * Fetch question from API if not provided via location state
   */
  useEffect(() => {
    if (questionFromState || !questionId) return;

    const fetchQuestion = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const question = await getQuestionById(questionId);
        setState((prev) => ({ ...prev, question, loading: false }));
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || "Failed to load question";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        message.error(errorMsg);
      }
    };

    fetchQuestion();
  }, [questionId, questionFromState]);

  /**
   * Handle save question
   * Receives question data and optional image file from QuestionForm
   */
  const handleSaveQuestion = async (
    questionData: QuestionRequestDTO,
    imageFile?: File
  ) => {
    try {
      if (!quizId) {
        message.error("Quiz ID not found");
        return;
      }

      if (!state.question?.questionId) {
        message.error("Question ID not found");
        return;
      }

      setState((prev) => ({ ...prev, submitting: true }));

      // Map QuestionRequestDTO to QuestionUpdateRequest
      // Only send fields that can be updated
      const updateRequest = {
        questionText: questionData.questionText,
        explanation: questionData.explanation,
        hint: questionData.hint,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
        points: questionData.points,
        timeLimitSeconds: questionData.timeLimitSeconds,
        shuffleOptions: questionData.shuffleOptions,
        caseInsensitive: questionData.caseInsensitive,
        partialCredit: questionData.partialCredit,
        options: questionData.options,
      };

      // Call updateQuestion with questionId, updateRequest, and optional image
      await updateQuestion(state.question.questionId, updateRequest, imageFile);

      message.success("Question updated successfully!");

      // Navigate back to quiz edit page with success state
      navigate(`/quiz/${quizId}/edit`, {
        state: { updatedQuestion: true, successMessage: "Question updated successfully!" },
      });
    } catch (error: any) {
      console.error("Error saving question:", error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update question";

      message.error(errorMsg);
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  /**
   * Handle cancel - navigate back to edit page
   */
  const handleCancel = () => {
    navigate(`/quiz/${quizId}/edit`);
  };

  // Validation - check if required data exists
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

  // Show error state
  if (state.error && !state.loading) {
    return (
      <Empty
        description={`Error: ${state.error}`}
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

  // Show loading state
  if (state.loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--background-color)",
          color: "var(--text-color)",
        }}
      >
        <Spin tip="Loading question..." size="large" />
      </div>
    );
  }

  // Show not found state
  if (!state.question) {
    return (
      <Empty
        description="Question not found"
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

  // Convert QuestionResponseDTO to QuestionRequestDTO for form
  const initialQuestion: QuestionRequestDTO = {
    quizId,
    questionText: state.question.questionText,
    questionType: state.question.questionType,
    timeLimitSeconds: state.question.timeLimitSeconds,
    points: state.question.points,
    imageUrl: state.question.imageUrl,
    explanation: state.question.explanation,
    hint: state.question.hint,
    difficulty: state.question.difficulty,
    tags: state.question.tags,
    shuffleOptions: state.question.shuffleOptions,
    caseInsensitive: state.question.caseInsensitive,
    partialCredit: state.question.partialCredit,
    allowMultipleCorrect: state.question.allowMultipleCorrect,
    answerVariations: state.question.answerVariations,
    options: state.question.options,
  };

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
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <QuestionForm
          initialQuestion={initialQuestion}
          quizId={quizId}
          onSave={handleSaveQuestion}
          onCancel={handleCancel}
          isCreateMode={false}
          loading={state.submitting}
        />
      </div>
    </div>
  );
};

export default QuestionEditorPage;