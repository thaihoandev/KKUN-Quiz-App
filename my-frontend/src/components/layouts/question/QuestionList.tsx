// src/components/QuestionList.tsx
import React from "react";
import { Pagination } from "antd";
import QuestionCard from "@/components/cards/QuestionCard";
import { Question } from "@/interfaces";

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

  const handleChange = (uiPage: number, pageSize?: number) => {
    const newSize = pageSize ?? size;
    // If size changed, reset to first page
    if (newSize !== size) {
      onPageChange(0, newSize);
    } else {
      onPageChange(uiPage - 1, newSize); // convert 1-based -> 0-based
    }
  };

  return (
    <div className="card shadow-sm p-3 mt-2">
      <div className="d-flex justify-content-between align-items-center p-2">
        <h6 className="fw-bold mb-0">
          {start}-{end} of {total} QUESTIONS
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

      {loading ? (
        <p className="text-center text-muted">Loading questions...</p>
      ) : questions.length === 0 ? (
        <p className="text-center text-muted">No questions found.</p>
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

      {/* Pagination */}
      <div className="d-flex justify-content-end mt-3">
        <Pagination
          current={page + 1}           // Antd is 1-based
          pageSize={size}
          total={total}
          onChange={handleChange}
          showSizeChanger
          pageSizeOptions={[5, 10, 20, 50]}
          showTotal={(t, range) => `${range[0]}-${range[1]} of ${t} items`}
        />
      </div>
    </div>
  );
};

export default QuestionList;
