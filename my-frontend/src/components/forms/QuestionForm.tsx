import React, { useState } from "react";
import { Button, Select, Space, Upload, message, Tooltip, Modal } from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  StarOutlined,
  PictureOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { QuestionRequestDTO, OptionRequestDTO, QuestionType } from "@/services/questionService";

interface QuestionFormProps {
  initialQuestion?: QuestionRequestDTO;
  initialQuestionType?: string;
  quizId: string;
  onSave: (formData: any) => Promise<void>;
  onCancel: () => void;
  isCreateMode?: boolean;
  loading?: boolean;
}

// Default values
const DEFAULT_TIME_LIMIT = 30;
const DEFAULT_POINTS = 1000;
const AVAILABLE_TYPES = Object.values(QuestionType);
const TIME_LIMIT_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 120, 180, 300];
const POINTS_OPTIONS = [50, 100, 250, 500, 1000, 2500, 5000];

// Option colors for UI
const OPTION_COLORS = ["#2E77BB", "#18A99D", "#F5A623", "#E84A5F"];

/**
 * Get question type label
 */
function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    [QuestionType.SINGLE_CHOICE]: "Single Choice",
    [QuestionType.MULTIPLE_CHOICE]: "Multiple Choice",
    [QuestionType.TRUE_FALSE]: "True/False",
    [QuestionType.FILL_IN_THE_BLANK]: "Fill in Blank",
    [QuestionType.MATCHING]: "Matching",
    [QuestionType.ORDERING]: "Ordering",
    [QuestionType.DRAG_DROP]: "Drag & Drop",
    [QuestionType.SHORT_ANSWER]: "Short Answer",
    [QuestionType.ESSAY]: "Essay",
  };
  return labels[type] || type;
}

/**
 * Create default question for type
 */
function createDefaultQuestion(type: string): QuestionRequestDTO {
  const baseQuestion: QuestionRequestDTO = {
    quizId: "",
    questionText: "New question",
    questionType: type,
    timeLimitSeconds: DEFAULT_TIME_LIMIT,
    points: DEFAULT_POINTS,
    options: [],
  };

  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return {
        ...baseQuestion,
        questionText: "Multiple choice question",
        options: [
          { text: "Option 1", correct: true },
          { text: "Option 2", correct: false },
          { text: "Option 3", correct: false },
          { text: "Option 4", correct: false },
        ],
      };

    case QuestionType.TRUE_FALSE:
      return {
        ...baseQuestion,
        questionText: "True or False question",
        options: [
          { text: "True", correct: true },
          { text: "False", correct: false },
        ],
      };

    case QuestionType.SINGLE_CHOICE:
      return {
        ...baseQuestion,
        questionText: "Single choice question",
        options: [
          { text: "Option 1", correct: true },
          { text: "Option 2", correct: false },
          { text: "Option 3", correct: false },
          { text: "Option 4", correct: false },
        ],
      };

    case QuestionType.FILL_IN_THE_BLANK:
      return {
        ...baseQuestion,
        questionText: "Fill in the blank question",
        options: [{ text: "", correctAnswer: "", correct: true }],
      };

    default:
      return baseQuestion;
  }
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  initialQuestion,
  initialQuestionType,
  quizId,
  onSave,
  onCancel,
  isCreateMode = false,
  loading = false,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState<QuestionRequestDTO>(() => {
    if (initialQuestion) {
      return {
        ...initialQuestion,
        timeLimitSeconds: initialQuestion.timeLimitSeconds || DEFAULT_TIME_LIMIT,
        points: initialQuestion.points || DEFAULT_POINTS,
        questionType: initialQuestion.questionType || initialQuestionType || QuestionType.SINGLE_CHOICE,
      };
    }
    return {
      ...createDefaultQuestion(initialQuestionType || QuestionType.SINGLE_CHOICE),
      quizId,
    };
  });

  /**
   * Handle question type change
   */
  const handleQuestionTypeChange = (newType: string) => {
    if (isCreateMode || question.options.length === 0) {
      setQuestion(createDefaultQuestion(newType));
    } else {
      setQuestion({ ...question, questionType: newType });
    }
  };

  /**
   * Handle question text change
   */
  const handleQuestionTextChange = (text: string) => {
    setQuestion({ ...question, questionText: text });
  };

  /**
   * Handle option change
   */
  const handleOptionChange = (
    index: number,
    field: keyof OptionRequestDTO,
    value: string | boolean
  ) => {
    const newOptions = question.options?.map((option, i) =>
      i === index ? { ...option, [field]: value } : option
    ) || [];
    setQuestion({ ...question, options: newOptions });
  };

  /**
   * Handle time limit change
   */
  const handleTimeLimitChange = (value: number) => {
    setQuestion({ ...question, timeLimitSeconds: value });
  };

  /**
   * Handle points change
   */
  const handlePointsChange = (value: number) => {
    setQuestion({ ...question, points: value });
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setQuestion({
        ...question,
        imageUrl: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
    return false;
  };

  /**
   * Handle remove image
   */
  const handleRemoveImage = () => {
    setImageFile(null);
    setQuestion({ ...question, imageUrl: undefined });
  };

  /**
   * Handle save question
   */
  const handleSaveQuestion = async () => {
    if (!question.questionText?.trim()) {
      message.error("Question text is required");
      return;
    }

    if (!question.options || question.options.length === 0) {
      message.error("At least one option is required");
      return;
    }

    // Check if there's at least one correct answer
    const hasCorrectAnswer = question.options.some((opt) => opt.correct);
    if (!hasCorrectAnswer) {
      message.error("At least one correct answer is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append(
        "question",
        new Blob([JSON.stringify(question)], { type: "application/json" })
      );

      if (imageFile) {
        formData.append("image", imageFile);
      }

      await onSave(formData);
    } catch (error) {
      console.error("Error saving question:", error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggle correct answer
   */
  const toggleCorrectAnswer = (index: number) => {
    const isMultiple = question.questionType === QuestionType.MULTIPLE_CHOICE;

    if (isMultiple) {
      handleOptionChange(index, "correct", !question.options?.[index]?.correct);
    } else {
      // Single choice - only one correct answer
      const newOptions = question.options?.map((opt) => ({
        ...opt,
        correct: false,
      })) || [];
      newOptions[index].correct = true;
      setQuestion({ ...question, options: newOptions });
    }
  };

  /**
   * Delete option
   */
  const deleteOption = (index: number) => {
    const newOptions = question.options?.filter((_, i) => i !== index) || [];
    setQuestion({ ...question, options: newOptions });
  };

  /**
   * Add option
   */
  const addOption = () => {
    const newOptions = [
      ...(question.options || []),
      { text: "", correct: false },
    ];
    setQuestion({ ...question, options: newOptions });
  };

  const isMultipleChoice = question.questionType === QuestionType.MULTIPLE_CHOICE;
  const canAddMore =
    (question.options?.length || 0) < 5 &&
    (isMultipleChoice || question.questionType === QuestionType.SINGLE_CHOICE);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background-color)",
        color: "var(--text-color)",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Button onClick={onCancel} size="large">
            ← Back
          </Button>

          <Space wrap>
            {/* Question Type */}
            <Select
              value={question.questionType}
              onChange={handleQuestionTypeChange}
              style={{ minWidth: "180px" }}
              options={AVAILABLE_TYPES.map((type) => ({
                label: getQuestionTypeLabel(type),
                value: type,
              }))}
            />

            {/* Time Limit */}
            <Tooltip title="Time limit">
              <Select
                value={question.timeLimitSeconds}
                onChange={handleTimeLimitChange}
                style={{ minWidth: "120px" }}
                prefix={<ClockCircleOutlined />}
                options={TIME_LIMIT_OPTIONS.map((time) => ({
                  label: `${time}s`,
                  value: time,
                }))}
              />
            </Tooltip>

            {/* Points */}
            <Tooltip title="Points">
              <Select
                value={question.points}
                onChange={handlePointsChange}
                style={{ minWidth: "120px" }}
                prefix={<StarOutlined />}
                options={POINTS_OPTIONS.map((points) => ({
                  label: `${points}`,
                  value: points,
                }))}
              />
            </Tooltip>

            {/* Save Button */}
            <Button
              type="primary"
              size="large"
              onClick={handleSaveQuestion}
              loading={saving || loading}
            >
              {isCreateMode ? "Create" : "Save"}
            </Button>
          </Space>
        </div>

        {/* Question Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #2D0A40 0%, #1a0629 100%)",
            borderRadius: "var(--border-radius)",
            padding: "2.5rem",
            boxShadow: "var(--card-shadow)",
            color: "white",
          }}
        >
          {/* Image Section */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            {question.imageUrl ? (
              <div>
                <img
                  src={question.imageUrl}
                  alt="Question"
                  style={{
                    maxHeight: "200px",
                    maxWidth: "100%",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                  }}
                />
                <Button
                  type="text"
                  danger
                  onClick={handleRemoveImage}
                  style={{ color: "white" }}
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <Upload
                maxCount={1}
                accept="image/*"
                beforeUpload={handleImageUpload}
                showUploadList={false}
              >
                <Button
                  type="dashed"
                  icon={<PictureOutlined />}
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Add Image
                </Button>
              </Upload>
            )}
          </div>

          {/* Question Text */}
          <div style={{ marginBottom: "3rem", textAlign: "center" }}>
            <input
              type="text"
              value={question.questionText}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              placeholder="Enter your question"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                fontSize: "2rem",
                fontWeight: 600,
                textAlign: "center",
                padding: "0.75rem",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderBottomColor = "rgba(255, 255, 255, 0.6)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderBottomColor = "rgba(255, 255, 255, 0.3)";
              }}
            />
          </div>

          {/* Options Grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "3rem",
            }}
          >
            {question.options?.map((option, index) => {
              const color = OPTION_COLORS[index % OPTION_COLORS.length];
              const isCorrect = option.correct === true;

              return (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    width: "220px",
                    height: "180px",
                  }}
                >
                  <div
                    style={{
                      background: color,
                      borderRadius: "12px",
                      padding: "1rem",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      position: "relative",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {/* Correct Badge */}
                    <button
                      onClick={() => toggleCorrectAnswer(index)}
                      style={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "2px solid white",
                        background: isCorrect ? "white" : "transparent",
                        color: isCorrect ? color : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "bold",
                        transition: "all 0.25s ease",
                      }}
                      title={isCorrect ? "Correct answer" : "Mark as correct"}
                    >
                      {isCorrect && "✓"}
                    </button>

                    {/* Option Text */}
                    <input
                      type="text"
                      value={option.text || ""}
                      onChange={(e) =>
                        handleOptionChange(index, "text", e.target.value)
                      }
                      placeholder="Option text"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        textAlign: "center",
                        outline: "none",
                        paddingRight: "2.5rem",
                      }}
                    />

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteOption(index)}
                      style={{
                        position: "absolute",
                        bottom: "0.5rem",
                        right: "0.5rem",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        border: "2px solid white",
                        background: "transparent",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Option Button */}
            {canAddMore && (
              <div
                style={{
                  width: "220px",
                  height: "180px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={addOption}
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    border: "3px solid rgba(255, 255, 255, 0.5)",
                    background: "transparent",
                    color: "white",
                    fontSize: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Answer Type Indicator */}
          <div style={{ display: "flex", marginTop: "2rem", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "0.5rem 1.5rem",
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "50px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {isMultipleChoice ? "Multiple correct answers" : "Single correct answer"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;