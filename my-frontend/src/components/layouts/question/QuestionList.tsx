// src/components/QuestionList.tsx
import React from "react";
import QuestionCard from "@/components/cards/QuestionCard";
import { Question } from "@/interfaces";
import CustomPagination from "@/components/paginations/CustomPagination";

interface QuestionListProps {
  questions: Question[];         // items of the current page
  loading: boolean;
  showAnswers: boolean;
  onToggleShowAnswers: () => void;

  // pagination props
  total: number;                 // totalElements from backend
  page: number;                  // 0-based current page (backend style)
  size: number;                  // page size
  onPageChange: (page: number, size: number) => void; // expects 0-based page
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
  // Compute "start-end of total"
  const start = total === 0 ? 0 : page * size + 1;
  const end = Math.min(total, page * size + questions.length);

  const handleChange = (uiPage: number) => {
    onPageChange(uiPage - 1, size); // ✅ convert 1-based → 0-based
  };

  return (
    <div className="card shadow-sm p-3 mt-2">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
        <h6 className="fw-bold mb-0 text-uppercase">
          {start}-{end} of {total} Questions
        </h6>
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            checked={showAnswers}
            onChange={onToggleShowAnswers}
            disabled={loading}
          />
          <label className="form-check-label ms-2 fw-bold">Show Answers</label>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-muted mt-3">Loading questions...</p>
      ) : questions.length === 0 ? (
        <p className="text-center text-muted mt-3">No questions found.</p>
      ) : (
        questions.map((question, index) => (
          <QuestionCard
            key={question.questionId}
            question={question}
            index={page * size + index} // global index if needed
            showAnswers={showAnswers}
          />
        ))
      )}

      {/* ✅ Custom Pagination */}
      {total > 0 && (
        <div className="d-flex justify-content-end mt-4">
          <CustomPagination
            current={page + 1}
            total={total}
            pageSize={size}
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionList;
