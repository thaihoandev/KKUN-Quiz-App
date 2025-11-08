import React from "react";
import QuestionCard from "@/components/cards/QuestionCard";
import { Question } from "@/interfaces";
import CustomPagination from "@/components/paginations/CustomPagination";

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  showAnswers: boolean;
  onToggleShowAnswers: () => void;

  total: number;
  page: number;
  size: number;
  onPageChange: (page: number, size: number) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  loading,
  showAnswers,
  onToggleShowAnswers,
  total,
  page,
  size,
  onPageChange,
}) => {
  const start = total === 0 ? 0 : page * size + 1;
  const end = Math.min(total, page * size + questions.length);

  const handleChange = (uiPage: number) => {
    onPageChange(uiPage - 1, size);
  };

  return (
    <div
      style={{
        background: "var(--surface-color)",
        border: "none",
        borderRadius: "var(--border-radius)",
        overflow: "hidden",
        boxShadow: "var(--card-shadow)",
        padding: "1.5rem",
        marginTop: "1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "1rem",
          borderBottom: "2px solid var(--border-color)",
          marginBottom: "1rem",
          gap: "1rem",
          flexWrap: "wrap",
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
          {start}-{end} of {total} Questions
        </h6>

        {/* Show Answers Toggle */}
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
              width: "20px",
              height: "20px",
              cursor: loading ? "not-allowed" : "pointer",
              accentColor: "var(--primary-color)",
            }}
          />
          <span>Show Answers</span>
        </label>
      </div>

      {/* Content */}
      <div style={{ marginBottom: "1.5rem" }}>
        {loading ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              margin: "2rem 0",
              fontSize: "14px",
            }}
          >
            Loading questions...
          </p>
        ) : questions.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              margin: "2rem 0",
              fontSize: "14px",
            }}
          >
            No questions found.
          </p>
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
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <QuestionCard
                  question={question}
                  index={page * size + index}
                  showAnswers={showAnswers}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <CustomPagination
            current={page + 1}
            total={total}
            pageSize={size}
            onChange={handleChange}
          />
        </div>
      )}

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