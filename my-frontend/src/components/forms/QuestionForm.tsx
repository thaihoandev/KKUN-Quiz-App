import React, { useState } from "react";
import {
  Button,
  Select,
  Space,
  Upload,
  message,
  Tooltip,
  Input,
  InputNumber,
  Switch,
  Tag,
  Collapse,
  Alert,
} from "antd";
import { PictureOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
  QuestionRequestDTO,
  OptionRequestDTO,
  QuestionType,
} from "@/services/questionService";

interface QuestionFormProps {
  initialQuestion?: QuestionRequestDTO;
  initialQuestionType?: string;
  quizId: string;
  onSave: (question: QuestionRequestDTO, image?: File) => Promise<void>;
  onCancel: () => void;
  isCreateMode?: boolean;
  loading?: boolean;
}

const DEFAULT_TIME_LIMIT = 30;
const DEFAULT_POINTS = 1000;
const AVAILABLE_TYPES = Object.values(QuestionType);
const TIME_LIMIT_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 120, 180, 300];
const POINTS_OPTIONS = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD", "EXPERT"];
const OPTION_COLORS = ["#2E77BB", "#18A99D", "#F5A623", "#E84A5F"];

const TYPE_GUIDES: Record<string, { title: string; guide: string }> = {
  SINGLE_CHOICE: {
    title: "Single Choice",
    guide: "Học sinh chọn một đáp án đúng duy nhất. Lý tưởng cho kiểm tra nhanh kiến thức cơ bản.",
  },
  MULTIPLE_CHOICE: {
    title: "Multiple Choice",
    guide: "Học sinh chọn một hoặc nhiều đáp án đúng. Có thể đánh giá hiểu biết sâu hơn.",
  },
  TRUE_FALSE: {
    title: "True/False",
    guide: "Câu hỏi đúng/sai. Đơn giản, nhanh, phù hợp cho kiểm tra cơ bản.",
  },
  FILL_IN_THE_BLANK: {
    title: "Fill in the Blank",
    guide: "Học sinh điền từ/số vào chỗ trống. Hỗ trợ các biến thể và độ sai chính tả.",
  },
  MATCHING: {
    title: "Matching",
    guide: "Học sinh ghép đôi các mục trên trái với phải. Tốt cho kiểm tra từ vựng hoặc khái niệm.",
  },
  ORDERING: {
    title: "Ordering",
    guide: "Học sinh sắp xếp các bước hoặc mục theo đúng thứ tự. Kiểm tra sự hiểu biết về quy trình.",
  },
  DRAG_DROP: {
    title: "Drag & Drop",
    guide: "Học sinh kéo thả các mục vào các vùng chính xác. Tương tác, hấp dẫn.",
  },
  SHORT_ANSWER: {
    title: "Short Answer",
    guide: "Học sinh viết câu trả lời ngắn. Hỗ trợ các từ khóa cần thiết và điểm số một phần.",
  },
  ESSAY: {
    title: "Essay",
    guide: "Học sinh viết bài luận. Có thể kiểm tra đạo văn, đặt giới hạn từ.",
  },
  HOTSPOT: {
    title: "Hotspot",
    guide: "Học sinh nhấp vào khu vực chính xác trên hình ảnh. Tốt cho câu hỏi dựa trên hình ảnh.",
  },
  IMAGE_SELECTION: {
    title: "Image Selection",
    guide: "Học sinh chọn hình ảnh đúng. Phù hợp cho các bài kiểm tra bằng hình ảnh.",
  },
  DROPDOWN: {
    title: "Dropdown",
    guide: "Học sinh chọn từ danh sách thả xuống. Gọn gàng, tiết kiệm không gian.",
  },
  MATRIX: {
    title: "Matrix",
    guide: "Học sinh điền các giá trị trong ma trận. Tốt cho các câu hỏi phức tạp với nhiều biến.",
  },
  RANKING: {
    title: "Ranking",
    guide: "Học sinh xếp hạng các mục theo thứ tự ưu tiên. Hỗ trợ điểm số một phần.",
  },
};

function getQuestionTypeLabel(type: string): string {
  return TYPE_GUIDES[type]?.title || type;
}

function createDefaultQuestion(type: string, quizId: string): QuestionRequestDTO {
  const base = {
    quizId,
    questionText: "New question",
    questionType: type,
    timeLimitSeconds: DEFAULT_TIME_LIMIT,
    points: DEFAULT_POINTS,
    options: [],
    difficulty: "MEDIUM" as const,
    tags: [],
    shuffleOptions: false,
    caseInsensitive: false,
    partialCredit: false,
    allowMultipleCorrect: false,
    answerVariations: [],
  };

  const presets: Record<string, any> = {
    SINGLE_CHOICE: {
      ...base,
      questionText: "Select one correct option",
      options: [
        { text: "Option A", correct: true },
        { text: "Option B", correct: false },
        { text: "Option C", correct: false },
      ],
    },
    MULTIPLE_CHOICE: {
      ...base,
      questionText: "Select all correct options",
      allowMultipleCorrect: true,
      options: [
        { text: "Option A", correct: true },
        { text: "Option B", correct: true },
        { text: "Option C", correct: false },
      ],
    },
    TRUE_FALSE: {
      ...base,
      questionText: "True or False?",
      options: [
        { text: "True", correct: true },
        { text: "False", correct: false },
      ],
    },
    FILL_IN_THE_BLANK: {
      ...base,
      questionText: "Fill in: The capital of France is ____",
      caseInsensitive: true,
      options: [
        {
          correctAnswer: "Paris",
          acceptedVariations: "paris,PARIS",
          typoTolerance: 0,
          correct: true,
        },
      ],
    },
    MATCHING: {
      ...base,
      questionText: "Match items on left with right",
      shuffleOptions: true,
      options: [
        { leftItem: "Item 1", rightItem: "Match 1", matchKey: "1", correct: true },
        { leftItem: "Item 2", rightItem: "Match 2", matchKey: "2", correct: true },
      ],
    },
    ORDERING: {
      ...base,
      questionText: "Order the items correctly",
      options: [
        { item: "Step 1", correctPosition: 1, orderIndex: 1, correct: true },
        { item: "Step 2", correctPosition: 2, orderIndex: 2, correct: true },
      ],
    },
    DRAG_DROP: {
      ...base,
      questionText: "Drag items to correct zones",
      options: [
        { draggableItem: "Item 1", dropZoneId: "z1", dropZoneLabel: "Zone 1", correct: true },
        { draggableItem: "Item 2", dropZoneId: "z2", dropZoneLabel: "Zone 2", correct: true },
      ],
    },
    SHORT_ANSWER: {
      ...base,
      questionText: "What is the capital of France?",
      partialCredit: true,
      options: [
        {
          expectedAnswer: "Paris",
          requiredKeywords: ["Paris"],
          optionalKeywords: ["capital"],
          partialCreditPercentage: 50,
          correct: true,
        },
      ],
    },
    ESSAY: {
      ...base,
      questionText: "Write an essay about...",
      options: [
        {
          sampleAnswer: "Sample answer text",
          minWords: 100,
          maxWords: 500,
          enablePlagiarismCheck: true,
          correct: true,
        },
      ],
    },
    HOTSPOT: {
      ...base,
      questionText: "Click on the correct area",
      options: [
        {
          hotspotLabel: "Area 1",
          hotspotCoordinates: { x: 100, y: 100, radius: 50 },
          correct: true,
        },
      ],
    },
    IMAGE_SELECTION: {
      ...base,
      questionText: "Select the correct image",
      options: [
        { imageLabel: "Image A", thumbnailUrl: "", correct: true },
        { imageLabel: "Image B", thumbnailUrl: "", correct: false },
      ],
    },
    DROPDOWN: {
      ...base,
      questionText: "Select from dropdown",
      options: [
        { dropdownValue: "v1", displayLabel: "Option 1", placeholder: "Choose...", correct: true },
        { dropdownValue: "v2", displayLabel: "Option 2", correct: false },
      ],
    },
    MATRIX: {
      ...base,
      questionText: "Complete the matrix",
      options: [
        {
          rowId: "r1",
          columnId: "c1",
          rowLabel: "Row 1",
          columnLabel: "Col 1",
          cellValue: "value",
          isCorrectCell: true,
          correct: true,
        },
      ],
    },
    RANKING: {
      ...base,
      questionText: "Rank items in order",
      options: [
        { rankableItem: "Item 1", correctRank: 1, rankingScale: 5, allowPartialCredit: true, correct: true },
        { rankableItem: "Item 2", correctRank: 2, rankingScale: 5, allowPartialCredit: true, correct: true },
      ],
    },
  };

  return presets[type] || base;
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
  const [newTag, setNewTag] = useState("");

  const [question, setQuestion] = useState<QuestionRequestDTO>(() => {
    if (initialQuestion) {
      return {
        ...initialQuestion,
        timeLimitSeconds: initialQuestion.timeLimitSeconds || DEFAULT_TIME_LIMIT,
        points: initialQuestion.points || DEFAULT_POINTS,
        questionType: initialQuestion.questionType || initialQuestionType || QuestionType.SINGLE_CHOICE,
      };
    }
    return createDefaultQuestion(initialQuestionType || QuestionType.SINGLE_CHOICE, quizId);
  });

  const handleQuestionTypeChange = (newType: string) => {
    if (isCreateMode || question.options.length === 0) {
      setQuestion(createDefaultQuestion(newType, quizId));
    } else {
      setQuestion({ ...question, questionType: newType });
    }
  };

  const handleQuestionTextChange = (text: string) => {
    setQuestion({ ...question, questionText: text });
  };

  const handleOptionChange = (index: number, field: keyof OptionRequestDTO, value: any) => {
    const newOptions = question.options?.map((option, i) =>
      i === index ? { ...option, [field]: value } : option
    ) || [];
    setQuestion({ ...question, options: newOptions });
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setQuestion({ ...question, imageUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setQuestion({ ...question, imageUrl: undefined });
  };

  const handleSaveQuestion = async () => {
    if (!question.questionText?.trim()) {
      message.error("Question text is required");
      return;
    }
    if (!question.options || question.options.length === 0) {
      message.error("At least one option is required");
      return;
    }
    const hasCorrectAnswer = question.options.some((opt) => opt.correct);
    if (!hasCorrectAnswer) {
      message.error("At least one correct answer is required");
      return;
    }

    setSaving(true);
    try {
      // Ensure options is never null
      const questionToSave = {
        ...question,
        options: question.options || [],
      };
      await onSave(questionToSave, imageFile || undefined);
    } catch (error) {
      console.error("Error saving question:", error);
      message.error("Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const toggleCorrectAnswer = (index: number) => {
    const isMultiple = question.questionType === QuestionType.MULTIPLE_CHOICE;
    if (isMultiple) {
      handleOptionChange(index, "correct", !question.options?.[index]?.correct);
    } else {
      const newOptions = question.options?.map((opt) => ({ ...opt, correct: false })) || [];
      newOptions[index].correct = true;
      setQuestion({ ...question, options: newOptions });
    }
  };

  const deleteOption = (index: number) => {
    const newOptions = question.options?.filter((_, i) => i !== index) || [];
    setQuestion({ ...question, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), { text: "", correct: false }];
    setQuestion({ ...question, options: newOptions });
  };

  const addTag = () => {
    if (newTag.trim() && !question.tags?.includes(newTag.trim())) {
      setQuestion({ ...question, tags: [...(question.tags || []), newTag.trim()] });
      setNewTag("");
    }
  };

  const isChoiceType =
    question.questionType === QuestionType.SINGLE_CHOICE ||
    question.questionType === QuestionType.MULTIPLE_CHOICE ||
    question.questionType === QuestionType.TRUE_FALSE;

  const canAddMore = (question.options?.length || 0) < 10 && isChoiceType;

  const typeGuide = TYPE_GUIDES[question.questionType] || TYPE_GUIDES.SINGLE_CHOICE;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background-color)", color: "var(--text-color)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <Button onClick={onCancel} size="large">← Back</Button>
          <Space wrap>
            <Select
              value={question.questionType}
              onChange={handleQuestionTypeChange}
              style={{ minWidth: "150px" }}
              options={AVAILABLE_TYPES.map((type) => ({
                label: getQuestionTypeLabel(type),
                value: type,
              }))}
            />
            <Select
              value={question.timeLimitSeconds}
              onChange={(val) => setQuestion({ ...question, timeLimitSeconds: val })}
              style={{ minWidth: "110px" }}
              options={TIME_LIMIT_OPTIONS.map((t) => ({ label: `${t}s`, value: t }))}
            />
            <Select
              value={question.points}
              onChange={(val) => setQuestion({ ...question, points: val })}
              style={{ minWidth: "110px" }}
              options={POINTS_OPTIONS.map((p) => ({ label: `${p}pt`, value: p }))}
            />
            <Select
              value={question.difficulty}
              onChange={(val) => setQuestion({ ...question, difficulty: val })}
              style={{ minWidth: "110px" }}
              options={DIFFICULTY_LEVELS.map((d) => ({ label: d, value: d }))}
            />
            <Button type="primary" size="large" onClick={handleSaveQuestion} loading={saving || loading}>
              {isCreateMode ? "Create" : "Save"}
            </Button>
          </Space>
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", marginBottom: "2rem" }}>
          {/* Question Card */}
          <div style={{ background: "linear-gradient(135deg, #2D0A40 0%, #1a0629 100%)", borderRadius: "12px", padding: "2.5rem", color: "white" }}>
            {/* Image */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              {question.imageUrl ? (
                <div>
                  <img src={question.imageUrl} alt="Q" style={{ maxHeight: "200px", maxWidth: "100%", borderRadius: "10px", marginBottom: "1rem" }} />
                  <Button type="text" danger onClick={handleRemoveImage} style={{ color: "white" }}>Remove</Button>
                </div>
              ) : (
                <Upload maxCount={1} accept="image/*" beforeUpload={handleImageUpload} showUploadList={false}>
                  <Button type="dashed" icon={<PictureOutlined />} >Add Image</Button>
                </Upload>
              )}
            </div>

            {/* Question Text */}
            <div style={{ marginBottom: "3rem", textAlign: "center" }}>
              <textarea
                value={question.questionText}
                onChange={(e) => handleQuestionTextChange(e.target.value)}
                placeholder="Enter question"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "2px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontSize: "2rem",
                  fontWeight: 600,
                  textAlign: "center",
                  padding: "0.75rem",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "80px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
              {question.options?.map((opt, idx) => {
                const color = OPTION_COLORS[idx % 4];
                const isCorrect = opt.correct === true;

                if (question.questionType === QuestionType.FILL_IN_THE_BLANK) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Correct Answer</label>
                        <Input placeholder="e.g., Paris" value={opt.correctAnswer || ""} onChange={(e) => handleOptionChange(idx, "correctAnswer", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Accepted Variations (comma-separated)</label>
                        <Input placeholder="e.g., paris,PARIS,Parisians" value={opt.acceptedVariations || ""} onChange={(e) => handleOptionChange(idx, "acceptedVariations", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Typo Tolerance (0-5)</label>
                        <InputNumber min={0} max={5} placeholder="Typo Tolerance" value={opt.typoTolerance || 0} onChange={(v) => handleOptionChange(idx, "typoTolerance", v)} style={{ width: "100%" }} />
                      </div>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.MATCHING) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Left Item</label>
                        <Input placeholder="Item to match" value={opt.leftItem || ""} onChange={(e) => handleOptionChange(idx, "leftItem", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Right Item (Match)</label>
                        <Input placeholder="Correct match" value={opt.rightItem || ""} onChange={(e) => handleOptionChange(idx, "rightItem", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Match Key (Unique ID)</label>
                        <Input placeholder="e.g., 1, match_1" value={opt.matchKey || ""} onChange={(e) => handleOptionChange(idx, "matchKey", e.target.value)} />
                      </div>
                      <button
                        onClick={() => toggleCorrectAnswer(idx)}
                        style={{
                          background: isCorrect ? "#4CAF50" : "transparent",
                          color: "white",
                          border: "1px solid white",
                          padding: "0.5rem 1rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        {isCorrect ? "✓ Correct Match" : "Mark as Correct"}
                      </button>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.ORDERING) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Item/Step</label>
                        <Input placeholder="e.g., First step" value={opt.item || ""} onChange={(e) => handleOptionChange(idx, "item", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Correct Position</label>
                        <InputNumber min={1} placeholder="Position order" value={opt.correctPosition || 1} onChange={(v) => handleOptionChange(idx, "correctPosition", v)} style={{ width: "100%" }} />
                      </div>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.DRAG_DROP) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Draggable Item</label>
                        <Input placeholder="e.g., Item A" value={opt.draggableItem || ""} onChange={(e) => handleOptionChange(idx, "draggableItem", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Drop Zone ID</label>
                        <Input placeholder="e.g., zone1" value={opt.dropZoneId || ""} onChange={(e) => handleOptionChange(idx, "dropZoneId", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Drop Zone Label</label>
                        <Input placeholder="e.g., Zone 1" value={opt.dropZoneLabel || ""} onChange={(e) => handleOptionChange(idx, "dropZoneLabel", e.target.value)} />
                      </div>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.SHORT_ANSWER) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Expected Answer</label>
                        <Input.TextArea placeholder="Full expected answer" rows={2} value={opt.expectedAnswer || ""} onChange={(e) => handleOptionChange(idx, "expectedAnswer", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Required Keywords (comma-separated)</label>
                        <Input placeholder="e.g., Paris,France" value={Array.isArray(opt.requiredKeywords) ? opt.requiredKeywords.join(",") : ""} onChange={(e) => handleOptionChange(idx, "requiredKeywords", e.target.value.split(",").map(k => k.trim()))} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Partial Credit %</label>
                        <InputNumber min={0} max={100} placeholder="e.g., 50" value={opt.partialCreditPercentage || 50} onChange={(v) => handleOptionChange(idx, "partialCreditPercentage", v)} style={{ width: "100%" }} />
                      </div>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.ESSAY) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Sample Answer</label>
                        <Input.TextArea placeholder="Reference/example answer" rows={3} value={opt.sampleAnswer || ""} onChange={(e) => handleOptionChange(idx, "sampleAnswer", e.target.value)} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Minimum Words</label>
                          <InputNumber min={0} placeholder="e.g., 100" value={opt.minWords || 100} onChange={(v) => handleOptionChange(idx, "minWords", v)} style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Maximum Words</label>
                          <InputNumber min={0} placeholder="e.g., 500" value={opt.maxWords || 500} onChange={(v) => handleOptionChange(idx, "maxWords", v)} style={{ width: "100%" }} />
                        </div>
                      </div>
                      <label><Switch checked={opt.enablePlagiarismCheck || false} onChange={(c) => handleOptionChange(idx, "enablePlagiarismCheck", c)} /> Check Plagiarism</label>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.HOTSPOT) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Hotspot Label</label>
                        <Input placeholder="e.g., Correct Area" value={opt.hotspotLabel || ""} onChange={(e) => handleOptionChange(idx, "hotspotLabel", e.target.value)} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>X Coordinate</label>
                          <InputNumber min={0} placeholder="100" value={opt.hotspotCoordinates?.x || 0} onChange={(v) => handleOptionChange(idx, "hotspotCoordinates", { ...opt.hotspotCoordinates, x: v })} style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Y Coordinate</label>
                          <InputNumber min={0} placeholder="100" value={opt.hotspotCoordinates?.y || 0} onChange={(v) => handleOptionChange(idx, "hotspotCoordinates", { ...opt.hotspotCoordinates, y: v })} style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Radius</label>
                          <InputNumber min={1} placeholder="50" value={opt.hotspotCoordinates?.radius || 50} onChange={(v) => handleOptionChange(idx, "hotspotCoordinates", { ...opt.hotspotCoordinates, radius: v })} style={{ width: "100%" }} />
                        </div>
                      </div>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.IMAGE_SELECTION) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Image Label</label>
                        <Input placeholder="e.g., Image A" value={opt.imageLabel || ""} onChange={(e) => handleOptionChange(idx, "imageLabel", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Thumbnail URL</label>
                        <Input placeholder="https://example.com/image.jpg" value={opt.thumbnailUrl || ""} onChange={(e) => handleOptionChange(idx, "thumbnailUrl", e.target.value)} />
                      </div>
                      <button
                        onClick={() => toggleCorrectAnswer(idx)}
                        style={{
                          background: isCorrect ? "#4CAF50" : "transparent",
                          color: "white",
                          border: "1px solid white",
                          padding: "0.5rem 1rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {isCorrect ? "✓ Correct Image" : "Mark as Correct"}
                      </button>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.DROPDOWN) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Value</label>
                        <Input placeholder="e.g., val1" value={opt.dropdownValue || ""} onChange={(e) => handleOptionChange(idx, "dropdownValue", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Display Label</label>
                        <Input placeholder="e.g., Option 1" value={opt.displayLabel || ""} onChange={(e) => handleOptionChange(idx, "displayLabel", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Placeholder</label>
                        <Input placeholder="e.g., Choose option" value={opt.placeholder || ""} onChange={(e) => handleOptionChange(idx, "placeholder", e.target.value)} />
                      </div>
                      <button
                        onClick={() => toggleCorrectAnswer(idx)}
                        style={{
                          background: isCorrect ? "#4CAF50" : "transparent",
                          color: "white",
                          border: "1px solid white",
                          padding: "0.5rem 1rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {isCorrect ? "✓ Correct" : "Mark as Correct"}
                      </button>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.MATRIX) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Row Label</label>
                        <Input placeholder="e.g., Row 1" value={opt.rowLabel || ""} onChange={(e) => handleOptionChange(idx, "rowLabel", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Column Label</label>
                        <Input placeholder="e.g., Column 1" value={opt.columnLabel || ""} onChange={(e) => handleOptionChange(idx, "columnLabel", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Cell Value</label>
                        <Input placeholder="e.g., value" value={opt.cellValue || ""} onChange={(e) => handleOptionChange(idx, "cellValue", e.target.value)} />
                      </div>
                      <label><Switch checked={opt.isCorrectCell || false} onChange={(c) => handleOptionChange(idx, "isCorrectCell", c)} /> Is Correct Cell</label>
                    </div>
                  );
                }

                if (question.questionType === QuestionType.RANKING) {
                  return (
                    <div key={idx} style={{ width: "100%", background: color, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", color: "white" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Rankable Item</label>
                        <Input placeholder="e.g., Item 1" value={opt.rankableItem || ""} onChange={(e) => handleOptionChange(idx, "rankableItem", e.target.value)} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Correct Rank</label>
                        <InputNumber min={1} placeholder="e.g., 1" value={opt.correctRank || 1} onChange={(v) => handleOptionChange(idx, "correctRank", v)} style={{ width: "100%" }} />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}>Ranking Scale</label>
                        <InputNumber min={1} placeholder="e.g., 5" value={opt.rankingScale || 5} onChange={(v) => handleOptionChange(idx, "rankingScale", v)} style={{ width: "100%" }} />
                      </div>
                      <label><Switch checked={opt.allowPartialCredit || false} onChange={(c) => handleOptionChange(idx, "allowPartialCredit", c)} /> Allow Partial Credit</label>
                    </div>
                  );
                }

                // Default: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, etc.
                return (
                  <div key={idx} style={{ position: "relative", width: "220px" }}>
                    <div style={{ background: color, borderRadius: "12px", padding: "1rem", minHeight: "160px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
                      <button onClick={() => toggleCorrectAnswer(idx)} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "28px", height: "28px", borderRadius: "50%", border: "2px solid white", background: isCorrect ? "white" : "transparent", color: isCorrect ? color : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "bold" }}>
                        {isCorrect && "✓"}
                      </button>
                      <textarea value={opt.text || ""} onChange={(e) => handleOptionChange(idx, "text", e.target.value)} placeholder="Option text" style={{ width: "100%", background: "transparent", border: "none", color: "white", fontSize: "1rem", fontWeight: 600, textAlign: "center", outline: "none", resize: "vertical", minHeight: "60px", fontFamily: "inherit" }} />
                      <button onClick={() => deleteOption(idx)} style={{ position: "absolute", bottom: "0.5rem", right: "0.5rem", width: "24px", height: "24px", borderRadius: "4px", border: "1px solid white", background: "transparent", color: "white", cursor: "pointer", fontSize: "16px" }}>×</button>
                    </div>
                  </div>
                );
              })}

              {canAddMore && (
                <div style={{ width: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <button onClick={addOption} style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", background: "transparent", color: "white", fontSize: "28px", cursor: "pointer", transition: "all 0.25s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}>+</button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Tags */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "1rem" }}>
              <h4>Tags</h4>
              <Space wrap style={{ marginBottom: "0.5rem" }}>
                {question.tags?.map((t) => <Tag key={t} closable onClose={() => setQuestion({ ...question, tags: (question.tags || []).filter(x => x !== t) })}>{t}</Tag>)}
              </Space>
              <Space style={{ width: "100%" }}>
                <Input size="small" placeholder="Add tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onPressEnter={addTag} style={{ flex: 1 }} />
                <Button size="small" onClick={addTag}>Add</Button>
              </Space>
            </div>

            {/* Explanation & Hint */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>Explanation</h4>
              <Input.TextArea rows={3} placeholder="Explain answer" value={question.explanation || ""} onChange={(e) => setQuestion({ ...question, explanation: e.target.value })} style={{ fontSize: "0.85rem", marginBottom: "1rem" }} />
              <h4 style={{ marginBottom: "0.5rem" }}>Hint</h4>
              <Input.TextArea rows={2} placeholder="Provide a hint" value={question.hint || ""} onChange={(e) => setQuestion({ ...question, hint: e.target.value })} style={{ fontSize: "0.85rem" }} />
            </div>

            {/* Advanced */}
            <Collapse items={[{
              key: "1",
              label: "Advanced Settings",
              children: (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                      <Switch checked={question.shuffleOptions} onChange={(c) => setQuestion({ ...question, shuffleOptions: c })} />
                      {" "}Shuffle Options
                    </label>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                      <Switch checked={question.caseInsensitive} onChange={(c) => setQuestion({ ...question, caseInsensitive: c })} />
                      {" "}Case Insensitive
                    </label>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                      <Switch checked={question.partialCredit} onChange={(c) => setQuestion({ ...question, partialCredit: c })} />
                      {" "}Partial Credit
                    </label>
                  </div>
                  {question.questionType === QuestionType.MULTIPLE_CHOICE && (
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                        <Switch checked={question.allowMultipleCorrect} onChange={(c) => setQuestion({ ...question, allowMultipleCorrect: c })} />
                        {" "}Allow Multiple Correct
                      </label>
                    </div>
                  )}
                </Space>
              )
            }]} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        </div>
      </div>
      {/* Type Guide Alert */}
        <Alert
          message={typeGuide.title}
          description={typeGuide.guide}
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: "2rem" }}
        />
    </div>
  );
};

export default QuestionForm;