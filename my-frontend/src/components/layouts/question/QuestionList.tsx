import React, { useMemo } from "react";
import { Spin, Empty } from "antd";
import QuestionCard from "@/components/cards/QuestionCard";
import { QuestionResponseDTO } from "@/services/questionService";

interface QuestionListProps {
  questions: QuestionResponseDTO[];
  loading?: boolean;
  showAnswers?: boolean;
  onToggleShowAnswers?: () => void;
  // Optional pagination props - can be omitted if handled externally
  total?: number;
  page?: number;
  size?: number;
  onPageChange?: (page: number, size: number) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  loading = false,
  showAnswers = true,
  onToggleShowAnswers,
  total,
  page = 0,
  size = 10,
}) => {
  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalQuestions = total ?? questions.length;
    const start = totalQuestions === 0 ? 0 : page * size + 1;
    const end = Math.min(totalQuestions, page * size + questions.length);

    return { start, end, total: totalQuestions };
  }, [total, page, size, questions.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Header - Only show if pagination controls are being used */}
      {(total !== undefined || onToggleShowAnswers) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem",
            background: "var(--surface-alt)",
            borderRadius: "var(--border-radius)",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h6
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "14px",
              textTransform: "uppercase",
              color: "var(--text-color)",
              letterSpacing: "0.5px",
            }}
          >
            {total !== undefined &&
              `${paginationInfo.start}-${paginationInfo.end} of ${paginationInfo.total}`}
            {total === undefined && `${questions.length} Questions`}
          </h6>

          {/* Show Answers Toggle */}
          {onToggleShowAnswers && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                userSelect: "none",
                fontWeight: 600,
                fontSize: "14px",
                color: "var(--text-color)",
              }}
            >
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={onToggleShowAnswers}
                disabled={loading}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: loading ? "not-allowed" : "pointer",
                  accentColor: "var(--primary-color)",
                }}
              />
              <span>Show Answers</span>
            </label>
          )}
        </div>
      )}

      {/* Content */}
      <div>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "3rem 1rem",
              minHeight: "200px",
            }}
          >
            <Spin tip="Loading questions..." />
          </div>
        ) : questions.length === 0 ? (
          <Empty
            description="No questions found"
            style={{
              padding: "2rem 1rem",
              color: "var(--text-light)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {questions.map((question, index) => (
              <div
                key={question.questionId}
                style={{
                  animation: `slideInUp 0.3s ease forwards`,
                  animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
                }}
              >
                <QuestionCard
                  question={question}
                  index={page * size + index + 1}
                  showAnswers={showAnswers}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default QuestionList;