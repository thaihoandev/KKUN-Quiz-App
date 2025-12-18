import { Tag, Badge } from "antd";
import { QuestionResponseDTO, OptionResponseDTO, QuestionType } from "@/services/questionService";
import type React from "react";

interface QuestionCardProps {
  question: QuestionResponseDTO;
  index: number;
  showAnswers?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  showAnswers = true,
}) => {
  const domKey = (question.questionId || `q-${index}`).toString();

  /**
   * Get human-readable question type label
   */
  const renderQuestionType = (): string => {
    switch (question.questionType) {
      case QuestionType.SINGLE_CHOICE:
        return "Single Choice";
      case QuestionType.MULTIPLE_CHOICE:
        return "Multiple Choice";
      case QuestionType.TRUE_FALSE:
        return "True/False";
      case QuestionType.FILL_IN_THE_BLANK:
        return "Fill in the Blank";
      case QuestionType.MATCHING:
        return "Matching";
      case QuestionType.ORDERING:
        return "Ordering";
      case QuestionType.DRAG_DROP:
        return "Drag & Drop";
      case QuestionType.SHORT_ANSWER:
        return "Short Answer";
      case QuestionType.ESSAY:
        return "Essay";
      case QuestionType.HOTSPOT:
        return "Hotspot";
      case QuestionType.IMAGE_SELECTION:
        return "Image Selection";
      case QuestionType.DROPDOWN:
        return "Dropdown";
      case QuestionType.MATRIX:
        return "Matrix";
      case QuestionType.RANKING:
        return "Ranking";
      default:
        return "Question";
    }
  };

  /**
   * Get input type for checkbox/radio display
   */
  const getInputType = (): "radio" | "checkbox" => {
    switch (question.questionType) {
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        return "radio";
      case QuestionType.MULTIPLE_CHOICE:
        return "checkbox";
      default:
        return "radio";
    }
  };

  /**
   * Determine difficulty color
   */
  const getDifficultyColor = (
    difficulty: string
  ): "default" | "success" | "warning" | "error" => {
    switch (difficulty?.toUpperCase()) {
      case "EASY":
        return "success";
      case "MEDIUM":
        return "warning";
      case "HARD":
      case "EXPERT":
        return "error";
      default:
        return "default";
    }
  };

  /**
   * Render options based on question type
   */
  const renderOptions = () => {
    const options = question.options || [];

    if (options.length === 0) {
      return (
        <div
          style={{
            padding: "1rem",
            textAlign: "center",
            color: "var(--text-light)",
            fontSize: "14px",
          }}
        >
          No options available
        </div>
      );
    }

    // For simple choice questions (Single, Multiple, True/False)
    if (
      [
        QuestionType.SINGLE_CHOICE,
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.TRUE_FALSE,
      ].includes(question.questionType as QuestionType)
    ) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {options.map((option, idx) => {
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
                  background: isCorrect
                    ? "rgba(74, 222, 128, 0.05)"
                    : "transparent",
                  transition: "all 0.25s ease",
                  cursor: "default",
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
                      cursor: "default",
                      accentColor: isCorrect
                        ? "var(--success-color)"
                        : "var(--primary-color)",
                      flexShrink: 0,
                    }}
                  />

                  <label
                    htmlFor={inputId}
                    style={{
                      margin: 0,
                      cursor: "default",
                      color: isCorrect
                        ? "var(--success-color)"
                        : "var(--text-color)",
                      fontWeight: isCorrect ? 600 : 500,
                      fontSize: "14px",
                      flex: 1,
                      lineHeight: "1.4",
                    }}
                  >
                    {option.text}
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
      );
    }

    // For Fill in the Blank
    if (question.questionType === QuestionType.FILL_IN_THE_BLANK) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {options.map((option, idx) => (
            <div
              key={option.optionId || idx}
              style={{
                padding: "1rem",
                border: `2px solid var(--border-color)`,
                borderRadius: "10px",
                background: showAnswers
                  ? "rgba(74, 222, 128, 0.05)"
                  : "transparent",
              }}
            >
              <div style={{ color: "var(--text-light)", fontSize: "12px" }}>
                Expected Answer:
              </div>
              <div
                style={{
                  color: "var(--text-color)",
                  fontWeight: 600,
                  fontSize: "14px",
                  marginTop: "0.5rem",
                }}
              >
                {option.correctAnswer || option.text}
              </div>
              {showAnswers && option.acceptedVariations && (
                <div
                  style={{
                    color: "var(--text-light)",
                    fontSize: "12px",
                    marginTop: "0.5rem",
                  }}
                >
                  Variations: {option.acceptedVariations}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // For Matching
    if (question.questionType === QuestionType.MATCHING) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {options.map((option, idx) => (
            <div
              key={option.optionId || idx}
              style={{
                padding: "1rem",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                background: "var(--surface-alt)",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-light)", fontSize: "12px" }}>
                    Left Item
                  </div>
                  <div
                    style={{
                      color: "var(--text-color)",
                      fontWeight: 500,
                      fontSize: "14px",
                    }}
                  >
                    {option.leftItem}
                  </div>
                </div>
                <span style={{ color: "var(--text-light)" }}>→</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-light)", fontSize: "12px" }}>
                    Right Item
                  </div>
                  <div
                    style={{
                      color: "var(--text-color)",
                      fontWeight: 500,
                      fontSize: "14px",
                    }}
                  >
                    {option.rightItem}
                  </div>
                </div>
              </div>
              {showAnswers && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.5rem",
                    background: "rgba(74, 222, 128, 0.1)",
                    borderRadius: "6px",
                    color: "var(--success-color)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  ✓ Correct Match: {option.correctMatchKey}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // For other complex types, show generic display
    return (
      <div style={{ padding: "1rem", color: "var(--text-light)", fontSize: "14px" }}>
        {options.length} options available
      </div>
    );
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
          padding: "1.25rem",
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
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "var(--gradient-primary)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {index}
          </div>
          <span
            style={{
              color: "var(--text-color)",
              fontWeight: 600,
              fontSize: "15px",
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
          {/* Difficulty Badge */}
          <Badge
            color={getDifficultyColor(question.difficulty)}
            text={
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                {question.difficulty}
              </span>
            }
          />

          {/* Time Badge */}
          <Tag
            icon="⏱"
            color="blue"
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {question.timeLimitSeconds}s
          </Tag>

          {/* Points Badge */}
          <Tag
            icon="⭐"
            color="orange"
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {question.points} pt
          </Tag>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem" }}>
        {/* Question Image */}
        {question.imageUrl && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            <img
              src={question.imageUrl}
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

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
            }}
          >
            {question.tags.map((tag) => (
              <Tag
                key={tag}
                style={{
                  fontSize: "12px",
                  padding: "0.25rem 0.75rem",
                  background: "var(--surface-alt)",
                  color: "var(--text-light)",
                }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* Options */}
        {renderOptions()}

        {/* Explanation */}
        {showAnswers && question.explanation && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "rgba(59, 130, 246, 0.05)",
              borderLeft: "4px solid var(--primary-color)",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--primary-color)",
                marginBottom: "0.5rem",
              }}
            >
              💡 Explanation
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--text-color)",
                lineHeight: "1.5",
              }}
            >
              {question.explanation}
            </p>
          </div>
        )}

        {/* Hint */}
        {question.hint && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "rgba(251, 146, 60, 0.05)",
              borderLeft: "4px solid var(--warning-color)",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--warning-color)",
                marginBottom: "0.5rem",
              }}
            >
              🔍 Hint
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--text-color)",
                lineHeight: "1.5",
              }}
            >
              {question.hint}
            </p>
          </div>
        )}
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
          cursor: default;
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