import React from "react";
import QuestionEditorCard from "@/components/cards/QuestionEditorCard";
import { Question } from "@/interfaces";
import CustomPagination from "@/components/paginations/CustomPagination";

type QuestionWithClientKey = Question & { clientKey: string };

type Props = {
  quizId: string;
  questions: QuestionWithClientKey[];
  loading: boolean;

  page: number; // 0-based index
  size: number;
  total: number;
  onPageChange: (page0Based: number, size: number) => void;

  onAddQuestion: () => void;
  onTimeChange: (quizId: string, questionIdOrClientKey: string, time: number) => void;
  onPointsChange: (quizId: string, questionIdOrClientKey: string, points: number) => void;

  onAddSimilar: () => void;
  aiLoading?: boolean;
};

const QuizEditList: React.FC<Props> = ({
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
  onAddSimilar,
  aiLoading = false,
}) => {
  const start = total === 0 ? 0 : page * size + 1;
  const end = Math.min(total, page * size + questions.length);
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const handleChange = (newPage: number) => {
    onPageChange(newPage - 1, size); // ✅ chuyển 1-based → 0-based
  };

  return (
    <div className="col-8">
      {/* Header tools */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-baseline gap-2">
          <div className="fw-bold fs-5">
            {start}-{end}
          </div>
          <div className="fw-bold fs-6">of {total} questions</div>
          <div className="text-muted small">({totalPoints} points on this page)</div>
        </div>
        <button className="btn btn-outline-secondary btn-sm me-2" onClick={onAddQuestion}>
          <i className="bx bx-plus-circle"></i>
          <span className="ms-1">Thêm câu hỏi</span>
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
        <div>
          {questions.map((q, idx) => {
            const key = q.clientKey || q.questionId || `q-${idx}`;
            const globalIndex = page * size + idx;
            return (
              <QuestionEditorCard
                key={key}
                quizId={quizId}
                question={q}
                index={globalIndex}
                onTimeChange={onTimeChange}
                onPointsChange={onPointsChange}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 card shadow-sm">
          <div className="card-body">
            <p className="mb-3">Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
            <button className="btn btn-primary" onClick={onAddQuestion}>
              <i className="bx bx-plus-circle me-1"></i>
              <span>Thêm câu hỏi</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          <button className="btn btn-outline-primary me-2" onClick={onAddQuestion}>
            <i className="bx bx-plus-circle"></i>
            <span className="ms-1">Thêm câu hỏi</span>
          </button>

          <button
            className="btn btn-outline-secondary"
            onClick={onAddSimilar}
            disabled={aiLoading}
            title="AI sẽ gợi ý câu hỏi tương tự"
          >
            {aiLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                <span>Đang sinh (AI)...</span>
              </>
            ) : (
              <>
                <i className="bx bx-bulb"></i>
                <span className="ms-1">Thêm tương tự (AI)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ✅ Custom Pagination */}
      {total > 0 && (
        <div className="d-flex justify-content-end align-items-center mt-4">
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

export default QuizEditList;
