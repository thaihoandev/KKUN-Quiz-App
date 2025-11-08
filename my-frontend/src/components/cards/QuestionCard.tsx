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
      case QUESTION_TYPES.SINGLE_CHOICE:
        return "Choose one answer";
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return "Choose one or more answers";
      case QUESTION_TYPES.TRUE_FALSE:
        return "True/False";
      case QUESTION_TYPES.FILL_IN_THE_BLANK:
        return "Fill in the blank";
      default:
        return "Type of question";
    }
  };

  const getInputType = () => {
    switch (question.questionType) {
      case QUESTION_TYPES.SINGLE_CHOICE:
      case QUESTION_TYPES.TRUE_FALSE:
        return "radio";
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return "checkbox";
      default:
        return "radio";
    }
  };

  return (
    <div
      data-qkey={domKey}
      style={{
        background: "var(--surface-color)",
        border: "none",
        borderRadius: "var(--border-radius)",
        overflow: "hidden",
        boxShadow: "var(--card-shadow)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--hover-shadow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--card-shadow)";
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "var(--surface-alt)",
          padding: "1rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Index & Type */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--gradient-primary)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            {index + 1}
          </div>
          <span
            style={{
              color: "var(--text-color)",
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            {renderQuestionType()}
          </span>
        </div>

        {/* Right: Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {/* Time Badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.8rem",
              borderRadius: "20px",
              background: "var(--primary-color)",
              color: "white",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <span>⏱</span>
            {question.timeLimit} sec
          </span>

          {/* Points Badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.8rem",
              borderRadius: "20px",
              background: "var(--warning-color)",
              color: "var(--text-invert)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <span>⭐</span>
            {question.points} pt
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem" }}>
        {/* Question Image */}
        {question?.imageUrl && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            <img
              src={question.imageUrl || "/placeholder.svg"}
              alt="Question"
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                objectFit: "cover",
                borderRadius: "10px",
              }}
            />
          </div>
        )}

        {/* Question Text */}
        <h5
          style={{
            margin: "0 0 1.5rem 0",
            fontWeight: 600,
            color: "var(--text-color)",
            fontSize: "16px",
            lineHeight: "1.5",
          }}
        >
          {question.questionText}
        </h5>

        {/* Options Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {(question.options || []).map((option, idx) => {
            const optKey = option.optionId || `${domKey}-opt-${idx}`;
            const inputId = `answer-${domKey}-${idx}`;
            const inputName = `question-${domKey}`;
            const isCorrect = showAnswers && option.correct;

            return (
              <div
                key={optKey}
                style={{
                  padding: "1rem",
                  border: `2px solid ${
                    isCorrect ? "var(--success-color)" : "var(--border-color)"
                  }`,
                  borderRadius: "10px",
                  background: isCorrect ? "rgba(74, 222, 128, 0.05)" : "transparent",
                  transition: "all 0.25s ease",
                  cursor: "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (!isCorrect) {
                    e.currentTarget.style.borderColor = "var(--primary-color)";
                    e.currentTarget.style.background = "var(--surface-alt)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCorrect) {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  {/* Checkbox/Radio */}
                  <input
                    type={getInputType()}
                    id={inputId}
                    name={inputName}
                    checked={isCorrect}
                    readOnly
                    disabled
                    style={{
                      width: "18px",
                      height: "18px",
                      marginTop: "2px",
                      cursor: "not-allowed",
                      accentColor: isCorrect ? "var(--success-color)" : "var(--primary-color)",
                      flexShrink: 0,
                    }}
                  />

                  {/* Label */}
                  <label
                    htmlFor={inputId}
                    style={{
                      margin: 0,
                      cursor: "not-allowed",
                      color: isCorrect ? "var(--success-color)" : "var(--text-color)",
                      fontWeight: isCorrect ? 600 : 500,
                      fontSize: "14px",
                      flex: 1,
                      lineHeight: "1.4",
                    }}
                  >
                    {option.optionText}
                    {isCorrect && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontWeight: 600,
                          color: "var(--success-color)",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        input[type="radio"],
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-color);
          border-radius: ${getInputType() === "radio" ? "50%" : "4px"};
          cursor: not-allowed;
          accent-color: var(--primary-color);
          transition: all 0.25s ease;
        }

        input[type="radio"]:checked,
        input[type="checkbox"]:checked {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }

        input[type="radio"]:checked::after {
          content: '';
          display: block;
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          position: relative;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
    </div>
  );
};

export default QuestionCard;