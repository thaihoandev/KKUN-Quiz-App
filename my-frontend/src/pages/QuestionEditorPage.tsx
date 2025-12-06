import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Empty, Spin, message } from "antd";
import {
  updateQuestion,
  QuestionResponseDTO,
  QuestionRequestDTO,
} from "@/services/questionService";
import QuestionForm from "@/components/forms/QuestionForm";

interface QuestionEditorPageState {
  loading: boolean;
  submitting: boolean;
}

const QuestionEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams<{ quizId: string }>();
  const question = location.state?.question as QuestionResponseDTO;

  const [state, setState] = useState<QuestionEditorPageState>({
    loading: false,
    submitting: false,
  });

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

      if (!question?.questionId) {
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
      await updateQuestion(question.questionId, updateRequest, imageFile);

      message.success("Question updated successfully!");

      // Navigate back to quiz edit page
      navigate(`/quizzes/${quizId}/edit`, {
        state: { updatedQuestion: true },
      });
    } catch (error: any) {
      console.error("Error saving question:", error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update question";

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

  if (!question) {
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
    questionText: question.questionText,
    questionType: question.questionType,
    timeLimitSeconds: question.timeLimitSeconds,
    points: question.points,
    imageUrl: question.imageUrl,
    explanation: question.explanation,
    hint: question.hint,
    difficulty: question.difficulty,
    tags: question.tags,
    shuffleOptions: question.shuffleOptions,
    caseInsensitive: question.caseInsensitive,
    partialCredit: question.partialCredit,
    allowMultipleCorrect: question.allowMultipleCorrect,
    answerVariations: question.answerVariations,
    options: question.options,
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
          maxWidth: "900px",
          margin: "0 auto",
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
            <Spin tip="Loading question..." size="large" />
          </div>
        ) : (
          <QuestionForm
            initialQuestion={initialQuestion}
            quizId={quizId}
            onSave={handleSaveQuestion}
            onCancel={handleCancel}
            isCreateMode={false}
            loading={state.submitting}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionEditorPage;