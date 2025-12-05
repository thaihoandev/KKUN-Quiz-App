import React, { useMemo } from "react";
import { Button, Spin, Empty, Space, Pagination, Tag, Tooltip } from "antd";
import {
  PlusCircleOutlined,
  BulbOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import QuestionEditorCard from "@/components/cards/QuestionEditorCard";
import { QuestionResponseDTO } from "@/services/questionService";

type QuestionWithClientKey = QuestionResponseDTO & { clientKey: string };

interface QuizEditListProps {
  quizId: string;
  questions: QuestionWithClientKey[];
  loading: boolean;
  page: number; // 0-based index
  size: number;
  total: number;
  onPageChange: (page0Based: number, size: number) => void;
  onAddQuestion: () => void;
  onTimeChange: (
    quizId: string,
    questionIdOrClientKey: string,
    time: number
  ) => void;
  onPointsChange: (
    quizId: string,
    questionIdOrClientKey: string,
    points: number
  ) => void;
  onAddSimilar: () => void;
  aiLoading?: boolean;
}

const QuizEditList: React.FC<QuizEditListProps> = ({
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
  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const start = total === 0 ? 0 : page * size + 1;
    const end = Math.min(total, page * size + questions.length);
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    return { start, end, totalPoints };
  }, [page, size, total, questions]);

  /**
   * Handle pagination change (convert 1-based to 0-based)
   */
  const handlePageChange = (newPage: number) => {
    onPageChange(newPage - 1, size);
  };

  /**
   * Handle page size change
   */
  const handlePageSizeChange = (_current: number, newSize: number) => {
    onPageChange(0, newSize);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      {/* Header Controls */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            fontSize: "14px",
            color: "var(--text-light)",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--text-color)" }}>
            {paginationInfo.start}-{paginationInfo.end}
          </span>
          <span>of {total} questions</span>
          <span>
            ({paginationInfo.totalPoints} pts on this page)
          </span>
        </div>

        <Tooltip title="Add a new question">
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={onAddQuestion}
            size="middle"
          >
            Add Question
          </Button>
        </Tooltip>
      </div>

      {/* Questions List or Empty State */}
      <div>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "3rem 1rem",
              minHeight: "300px",
            }}
          >
            <Spin tip="Loading questions..." size="large" />
          </div>
        ) : questions.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {questions.map((q, idx) => {
              const key = q.clientKey || q.questionId || `q-${idx}`;
              const globalIndex = page * size + idx + 1;

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
          <Empty
            description="No questions yet"
            style={{
              padding: "3rem 1rem",
            }}
          >
            <Tooltip title="Create your first question">
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={onAddQuestion}
                size="large"
              >
                Add First Question
              </Button>
            </Tooltip>
          </Empty>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          padding: "1rem",
          background: "var(--surface-alt)",
          borderRadius: "var(--border-radius)",
        }}
      >
        <Tooltip title="Add a new question to quiz">
          <Button
            type="default"
            icon={<PlusCircleOutlined />}
            onClick={onAddQuestion}
          >
            Add Question
          </Button>
        </Tooltip>

        <Tooltip title="Generate similar questions using AI based on existing questions">
          <Button
            type="default"
            icon={<BulbOutlined />}
            onClick={onAddSimilar}
            disabled={aiLoading}
            loading={aiLoading}
          >
            {aiLoading ? "Generating (AI)..." : "AI Suggestions"}
          </Button>
        </Tooltip>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "1rem",
            background: "var(--surface-alt)",
            borderRadius: "var(--border-radius)",
          }}
        >
          <Pagination
            current={page + 1}
            total={total}
            pageSize={size}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
            showSizeChanger
            showTotal={(total) => `Total ${total} questions`}
            pageSizeOptions={["5", "10", "20", "50"]}
            style={{ marginBottom: 0 }}
          />
        </div>
      )}
    </div>
  );
};

export default  QuizEditList;