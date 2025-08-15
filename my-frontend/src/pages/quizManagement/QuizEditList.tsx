import React from "react";
import { Pagination } from "antd";
import QuestionEditorCard from "@/components/cards/QuestionEditorCard";
import { Question } from "@/interfaces";

type Props = {
  quizId: string;
  questions: Question[];                  // items of current page
  loading: boolean;

  // pagination
  page: number;                           // 0-based
  size: number;                           // page size
  total: number;                          // totalElements
  onPageChange: (page0Based: number, size: number) => void;

  // controls
  onAddQuestion: () => void;
  onTimeChange: (quizId: string, questionId: string, time: number) => void;
  onPointsChange: (quizId: string, questionId: string, points: number) => void;
};

const QuestionEditList: React.FC<Props> = ({
  quizId,
  questions,
  loading,
  page,
  size,
  total,
  onPageChange,
  onAddQuestion,
  onTimeChange,
  onPointsChange,
}) => {
  const start = total === 0 ? 0 : page * size + 1;
  const end = Math.min(total, page * size + questions.length);
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const handleChange = (uiPage: number, pageSize?: number) => {
    const newSize = pageSize ?? size;
    if (newSize !== size) {
      onPageChange(0, newSize);           // reset to first page when size changes
    } else {
      onPageChange(uiPage - 1, newSize);  // convert 1-based -> 0-based
    }
  };

  return (
    <div className="col-8">
      {/* Header tools */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <span className="fw-bold fs-5">
          {start}-{end} of {total} questions{" "}
          <span className="text-muted small">({totalPoints} points on this page)</span>
        </span>
        <button className="btn btn-outline-secondary btn-sm me-2" onClick={onAddQuestion}>
          <i className="bx bx-plus-circle"></i> Thêm câu hỏi
        </button>
      </div>

      {/* List / empty / loading */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="mt-2">Đang tải câu hỏi...</p>
        </div>
      ) : questions.length > 0 ? (
        questions.map((q, idx) => (
          <QuestionEditorCard
            key={q.questionId}
            quizId={quizId}
            question={q}
            index={page * size + idx} // global index
            onTimeChange={onTimeChange}
            onPointsChange={onPointsChange}
          />
        ))
      ) : (
        <div className="text-center py-4 card shadow-sm">
          <div className="card-body">
            <p className="mb-3">Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
            <button className="btn btn-primary" onClick={onAddQuestion}>
              <i className="bx bx-plus-circle me-1"></i> Thêm câu hỏi
            </button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
        <div className="d-flex justify-content-between align-items-center mt-4">
            <div>
            <button className="btn btn-outline-primary me-2" onClick={onAddQuestion}>
                <i className="bx bx-plus-circle"></i> Thêm câu hỏi
            </button>
            <button className="btn btn-outline-secondary">
                <i className="bx bx-bulb"></i> Thêm tương tự (AI)
            </button>
            </div> 
          </div>
          <div className="d-flex justify-content-end align-items-center mt-4">
        <Pagination
            current={page + 1}
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

export default QuestionEditList;
