import { QUESTION_TYPES } from "@/constants/quizConstants";
import type { Question } from "@/interfaces";
import type React from "react";

interface QuestionCardProps {
  question: Question & { clientKey?: string };
  index: number;
  showAnswers: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, showAnswers }) => {
  const domKey = (question.questionId || (question as any).clientKey || `q-${index}`).toString();

  const renderQuestionType = () => {
    switch (question.questionType) {
      case QUESTION_TYPES.SINGLE_CHOICE: return "Choose one answer";
      case QUESTION_TYPES.MULTIPLE_CHOICE: return "Choose one or more answers";
      case QUESTION_TYPES.TRUE_FALSE: return "True/False";
      case QUESTION_TYPES.FILL_IN_THE_BLANK: return "Fill in the blank";
      default: return "Type of question";
    }
  };

  const getInputType = () => {
    switch (question.questionType) {
      case QUESTION_TYPES.SINGLE_CHOICE:
      case QUESTION_TYPES.TRUE_FALSE: return "radio";
      case QUESTION_TYPES.MULTIPLE_CHOICE: return "checkbox";
      default: return "radio";
    }
  };

  return (
    <div className="card border-0 mb-3" data-qkey={domKey}>
      <div className="bg-light p-3 rounded-top d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: 30, height: 30 }}>
            {index + 1}
          </div>
          <span>{renderQuestionType()}</span>
        </div>
        <div className="d-flex align-items-center">
          <span className="badge bg-secondary me-2 px-3 py-2"><i className="bx bx-time-five me-1" />{question.timeLimit} sec</span>
          <span className="badge bg-warning text-dark px-3 py-2"><i className="bx bxs-star me-1" />{question.points} pt</span>
        </div>
      </div>

      <div className="card-body p-4">
        {question?.imageUrl && (
          <div className="text-center mb-4">
            <img src={question.imageUrl || "/placeholder.svg"} alt="Question" className="img-fluid rounded" style={{ maxWidth: "50%", maxHeight: 250, objectFit: "cover" }} />
          </div>
        )}

        <h5 className="mb-4">{question.questionText}</h5>

        <div className="row g-3">
          {(question.options || []).map((option, idx) => {
            const optKey = option.optionId || `${domKey}-opt-${idx}`; // ổn định
            const inputId = `answer-${domKey}-${idx}`;
            const inputName = `question-${domKey}`;
            return (
              <div key={optKey} className="col-md-6 mb-3">
                <div className={`border rounded p-3 d-flex align-items-center h-100 ${showAnswers && option.correct ? "border-success" : ""}`}>
                  <div className="form-check mb-0 flex-grow-1">
                    <input className="form-check-input" type={getInputType()} name={inputName} id={inputId}
                      checked={showAnswers ? !!option.correct : false} readOnly disabled />
                    <label className={`form-check-label ${showAnswers && option.correct ? "text-success fw-bold" : ""}`} htmlFor={inputId}>
                      {option.optionText}
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
