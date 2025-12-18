import React, { useState } from "react";
import { Button, Dropdown, Space, Tooltip, Popconfirm, message, Badge, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EllipsisOutlined,
  ClockCircleOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { softDeleteQuestion } from "@/services/questionService";
import { QuestionResponseDTO, QuestionType } from "@/services/questionService";

interface QuestionEditorCardProps {
  quizId: string;
  question: QuestionResponseDTO;
  index: number;
  onTimeChange: (quizId: string, questionId: string, time: number) => void;
  onPointsChange: (quizId: string, questionId: string, points: number) => void;
}

// Time limit options (in seconds)
const TIME_LIMIT_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 120, 180, 300];

// Points options
const POINTS_OPTIONS = [50, 100, 250, 500, 1000, 2500, 5000];

/**
 * Get question type label
 */
function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    [QuestionType.SINGLE_CHOICE]: "Single Choice",
    [QuestionType.MULTIPLE_CHOICE]: "Multiple Choice",
    [QuestionType.TRUE_FALSE]: "True/False",
    [QuestionType.FILL_IN_THE_BLANK]: "Fill Blank",
    [QuestionType.MATCHING]: "Matching",
    [QuestionType.ORDERING]: "Ordering",
    [QuestionType.DRAG_DROP]: "Drag & Drop",
    [QuestionType.SHORT_ANSWER]: "Short Answer",
    [QuestionType.ESSAY]: "Essay",
    [QuestionType.HOTSPOT]: "Hotspot",
    [QuestionType.IMAGE_SELECTION]: "Image",
    [QuestionType.DROPDOWN]: "Dropdown",
    [QuestionType.MATRIX]: "Matrix",
    [QuestionType.RANKING]: "Ranking",
  };
  return labels[type] || type;
}

/**
 * Get question type color
 */
function getQuestionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    [QuestionType.SINGLE_CHOICE]: "blue",
    [QuestionType.MULTIPLE_CHOICE]: "cyan",
    [QuestionType.TRUE_FALSE]: "green",
    [QuestionType.FILL_IN_THE_BLANK]: "orange",
    [QuestionType.SHORT_ANSWER]: "purple",
    [QuestionType.ESSAY]: "magenta",
    [QuestionType.MATCHING]: "volcano",
    [QuestionType.ORDERING]: "gold",
    [QuestionType.DRAG_DROP]: "red",
    [QuestionType.HOTSPOT]: "lime",
    [QuestionType.IMAGE_SELECTION]: "cyan",
    [QuestionType.DROPDOWN]: "blue",
    [QuestionType.MATRIX]: "purple",
    [QuestionType.RANKING]: "orange",
  };
  return colors[type] || "default";
}

const QuestionEditorCard: React.FC<QuestionEditorCardProps> = ({
  quizId,
  question,
  index,
  onTimeChange,
  onPointsChange,
}) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  console.log(question);

  /**
   * Handle edit question
   */
  const handleEdit = () => {
    navigate(`/quiz/${quizId}/questions/${question.questionId}/edit`, {
      state: { quizId, question },
    });
  };

  /**
   * Handle soft delete question
   */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await softDeleteQuestion(question.questionId);
      message.success("Question deleted successfully");
      // Optionally refetch or update parent state
      window.location.reload();
    } catch (error) {
      console.error("Error deleting question:", error);
      message.error("Failed to delete question");
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Handle copy question text
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(question.questionText);
    message.success("Question text copied!");
  };

  /**
   * Time limit menu items
   */
  const timeLimitItems = TIME_LIMIT_OPTIONS.map((time) => ({
    key: time.toString(),
    label: `${time}s`,
    onClick: () => onTimeChange(quizId, question.questionId, time),
  }));

  /**
   * Points menu items
   */
  const pointsItems = POINTS_OPTIONS.map((points) => ({
    key: points.toString(),
    label: `${points} pts`,
    onClick: () => onPointsChange(quizId, question.questionId, points),
  }));

  /**
   * Action menu items
   */
  const actionItems: any[] = [
    {
      key: "copy",
      label: "Copy",
      icon: <CopyOutlined />,
      onClick: handleCopy,
    },
    {
      key: "edit",
      label: "Edit",
      icon: <EditOutlined />,
      onClick: handleEdit,
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  const questionTypeLabel = getQuestionTypeLabel(question.questionType);
  const questionTypeColor = getQuestionTypeColor(question.questionType);

  return (
    <div
      style={{
        background: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--border-radius)",
        overflow: "hidden",
        boxShadow: "var(--card-shadow)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--hover-shadow)";
        e.currentTarget.style.borderColor = "var(--primary-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--card-shadow)";
        e.currentTarget.style.borderColor = "var(--border-color)";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          borderBottom: "1px solid var(--border-color)",
          background: "var(--surface-alt)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Left: Index & Type & Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            flex: 1,
            minWidth: "300px",
          }}
        >
          {/* Question Number */}
          <Badge
            count={index}
            style={{
              backgroundColor: "var(--primary-color)",
              fontSize: "12px",
              fontWeight: 600,
              minWidth: "28px",
              height: "28px",
              lineHeight: "28px",
            }}
          />

          {/* Question Type */}
          <Tag
            color={questionTypeColor}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 8px",
            }}
          >
            {questionTypeLabel}
          </Tag>

          {/* Time Limit Dropdown */}
          <Dropdown
            menu={{ items: timeLimitItems }}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Button
              type="text"
              size="small"
              icon={<ClockCircleOutlined />}
              style={{
                fontSize: "12px",
              }}
            >
              {question.timeLimitSeconds}s
            </Button>
          </Dropdown>

          {/* Points Dropdown */}
          <Dropdown
            menu={{ items: pointsItems }}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Button
              type="text"
              size="small"
              icon={<StarOutlined />}
              style={{
                fontSize: "12px",
              }}
            >
              {question.points}
            </Button>
          </Dropdown>
        </div>

        {/* Right: Action Menu */}
        <Dropdown
          menu={{ items: actionItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Button
            type="text"
            size="small"
            icon={<EllipsisOutlined />}
            style={{ fontSize: "16px" }}
          />
        </Dropdown>
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem" }}>
        {/* Question Text */}
        <h5
          style={{
            margin: "0 0 1rem 0",
            fontWeight: 600,
            color: "var(--text-color)",
            fontSize: "15px",
            lineHeight: "1.5",
          }}
        >
          {question.questionText}
        </h5>

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
                maxHeight: "250px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

        {/* Options Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {(question.options || []).map((option, optIdx) => {
            const isCorrect = option.correct === true;

            return (
              <div
                key={option.optionId || optIdx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  border: `2px solid ${
                    isCorrect ? "var(--success-color)" : "var(--border-color)"
                  }`,
                  borderRadius: "8px",
                  background: isCorrect
                    ? "rgba(74, 222, 128, 0.05)"
                    : "transparent",
                  transition: "all 0.25s ease",
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
                {isCorrect ? (
                  <CheckCircleOutlined
                    style={{
                      color: "var(--success-color)",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                ) : (
                  <CloseCircleOutlined
                    style={{
                      color: "var(--text-light)",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                )}

                <span
                  style={{
                    color: isCorrect
                      ? "var(--success-color)"
                      : "var(--text-color)",
                    fontWeight: isCorrect ? 600 : 500,
                    fontSize: "14px",
                    lineHeight: "1.4",
                  }}
                >
                  {option.text}
                </span>
              </div>
            );
          })}

          {(!question.options || question.options.length === 0) && (
            <div
              style={{
                padding: "1rem",
                textAlign: "center",
                color: "var(--text-light)",
                fontSize: "13px",
                gridColumn: "1 / -1",
              }}
            >
              No options available
            </div>
          )}
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
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
                marginBottom: "0.3rem",
              }}
            >
              💡 Explanation
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "var(--text-color)",
                lineHeight: "1.4",
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
              marginTop: "0.75rem",
              padding: "0.75rem",
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
                marginBottom: "0.3rem",
              }}
            >
              🔍 Hint
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "var(--text-color)",
                lineHeight: "1.4",
              }}
            >
              {question.hint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionEditorCard;