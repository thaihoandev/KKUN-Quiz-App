import React, { useState } from "react";
import {
    DEFAULT_POINTS,
    DEFAULT_QUESTION_TYPE,
    DEFAULT_TIME_LIMIT,
    POINTS_OPTIONS,
    QUESTION_TYPE_LABELS,
    QUESTION_TYPES,
    TIME_LIMIT_OPTIONS,
} from "@/constants/quizConstants";
import { Option, Question } from "@/interfaces";

interface QuestionFormProps {
    initialQuestion?: Question;
    initialQuestionType?: string;
    quizId: string;
    onSave: (formData: FormData) => Promise<void>;
    onCancel: () => void;
    isCreateMode?: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
    initialQuestion,
    initialQuestionType,
    quizId,
    onSave,
    onCancel,
    isCreateMode = false,
}) => {
    const [imageFile, setImageFile] = useState<File | null>(null);

    const createDefaultQuestion = (type: string): Question => {
        const baseQuestion: Question = {
            questionId: isCreateMode ? "" : initialQuestion?.questionId || "",
            questionType: type as Question["questionType"],
            questionText: "",
            options: [],
            timeLimit: DEFAULT_TIME_LIMIT,
            points: DEFAULT_POINTS,
        };

        switch (type) {
            case QUESTION_TYPES.MULTIPLE_CHOICE:
                return {
                    ...baseQuestion,
                    questionText: "Câu hỏi mới (Nhiều lựa chọn)",
                    options: [
                        { optionId: "", optionText: "", correct: true, correctAnswer: "" },
                        { optionId: "", optionText: "", correct: false, correctAnswer: "" },
                        { optionId: "", optionText: "", correct: false, correctAnswer: "" },
                        { optionId: "", optionText: "", correct: false, correctAnswer: "" },
                    ],
                };
            case QUESTION_TYPES.TRUE_FALSE:
                return {
                    ...baseQuestion,
                    questionText: "Câu hỏi mới (Đúng/Sai)",
                    options: [
                        { optionId: "", optionText: "Đúng", correct: true, correctAnswer: "Đúng" },
                        { optionId: "", optionText: "Sai", correct: false, correctAnswer: "" },
                    ],
                };
            case QUESTION_TYPES.FILL_IN_THE_BLANK:
                return {
                    ...baseQuestion,
                    questionText: "Câu hỏi mới (Điền vào chỗ trống)",
                    options: [
                        { optionId: "", optionText: "", correct: true, correctAnswer: "" },
                    ],
                };
            case QUESTION_TYPES.SINGLE_CHOICE:
                return {
                    ...baseQuestion,
                    questionText: "Câu hỏi mới (Một lựa chọn)",
                    options: [
                        { optionId: "", optionText: "", correct: true, correctAnswer: "" },
                        { optionId: "", optionText: "", correct: false, correctAnswer: "" },
                        { optionId: "", optionText: "", correct: false, correctAnswer: "" },
                        { optionId: "", optionText: "", correct: false, correctAnswer: "" },
                    ],
                };
            default:
                return baseQuestion;
        }
    };

    const [question, setQuestion] = useState<Question>(() => {
        if (initialQuestion) {
            return {
                ...initialQuestion,
                timeLimit: initialQuestion.timeLimit || DEFAULT_TIME_LIMIT,
                points: initialQuestion.points || DEFAULT_POINTS,
                questionType:
                    initialQuestion.questionType ||
                    initialQuestionType ||
                    DEFAULT_QUESTION_TYPE,
            };
        }
        return createDefaultQuestion(initialQuestionType || DEFAULT_QUESTION_TYPE);
    });

    const handleQuestionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as Question["questionType"];

        if (isCreateMode || question.options.length === 0) {
            setQuestion(createDefaultQuestion(newType));
        } else {
            setQuestion({ ...question, questionType: newType });
        }
    };

    const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuestion({ ...question, questionText: e.target.value });
    };

    const handleOptionChange = (
        index: number,
        field: keyof Option,
        value: string | boolean,
    ) => {
        const newOptions = question.options.map((option, i) =>
            i === index ? { ...option, [field]: value } : option,
        );
        setQuestion({ ...question, options: newOptions });
    };

    const handleTimeLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQuestion({ ...question, timeLimit: parseInt(e.target.value) });
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQuestion({ ...question, points: parseInt(e.target.value) });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const imageUrl = URL.createObjectURL(file);
            setQuestion({ ...question, imageUrl });
        }
    };

    const handleSaveQuestion = async () => {
        const formData = new FormData();
        formData.append(
            "question",
            new Blob([JSON.stringify(question)], { type: "application/json" }),
        );
        if (imageFile) {
            formData.append("image", imageFile);
        }
        await onSave(formData);
    };

    const isMultipleAnswers = question.questionType === QUESTION_TYPES.MULTIPLE_CHOICE;

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
                {/* Header Actions */}
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
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "0.75rem 1.5rem",
                            border: "2px solid var(--border-color)",
                            borderRadius: "10px",
                            background: "transparent",
                            color: "var(--text-color)",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--surface-color)";
                            e.currentTarget.style.borderColor = "var(--primary-color)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "var(--border-color)";
                        }}
                    >
                        ← Quay lại
                    </button>

                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                        {/* Question Type */}
                        <select
                            value={question.questionType}
                            onChange={handleQuestionTypeChange}
                            className="form-select"
                            style={{
                                minWidth: "180px",
                                color: "var(--text-color)",
                            }}
                        >
                            {Object.values(QUESTION_TYPES).map((type) => (
                                <option key={type} value={type}>
                                    {QUESTION_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </select>

                        {/* Time Limit */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.25rem" }}>⏱️</span>
                            <select
                                value={question.timeLimit}
                                onChange={handleTimeLimitChange}
                                className="form-select"
                                style={{
                                    minWidth: "120px",
                                    color: "var(--text-color)",
                                }}
                            >
                                {TIME_LIMIT_OPTIONS.map((seconds) => (
                                    <option key={seconds} value={seconds}>
                                        {seconds} giây
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Points */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.25rem" }}>🏆</span>
                            <select
                                value={question.points}
                                onChange={handlePointsChange}
                                className="form-select"
                                style={{
                                    minWidth: "120px",
                                    color: "var(--text-color)",
                                }}
                            >
                                {POINTS_OPTIONS.map((point) => (
                                    <option key={point} value={point}>
                                        {point} điểm
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveQuestion}
                            style={{
                                padding: "0.75rem 1.5rem",
                                border: "none",
                                borderRadius: "10px",
                                background: "var(--gradient-primary)",
                                color: "white",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.25s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            {isCreateMode ? "Tạo câu hỏi" : "Lưu câu hỏi"}
                        </button>
                    </div>
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
                    {question.imageUrl && (
                        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                            <img
                                src={question.imageUrl}
                                alt="Question image"
                                style={{
                                    maxHeight: "200px",
                                    maxWidth: "100%",
                                    borderRadius: "10px",
                                    marginBottom: "1rem",
                                }}
                            />
                            <button
                                onClick={() => {
                                    setImageFile(null);
                                    setQuestion({ ...question, imageUrl: undefined });
                                }}
                                style={{
                                    padding: "0.5rem 1rem",
                                    border: "2px solid rgba(255, 255, 255, 0.5)",
                                    borderRadius: "8px",
                                    background: "transparent",
                                    color: "white",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                Xóa ảnh
                            </button>
                        </div>
                    )}

                    {!question.imageUrl && (
                        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                            <label
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    border: "2px solid rgba(255, 255, 255, 0.5)",
                                    borderRadius: "10px",
                                    background: "transparent",
                                    color: "white",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <span style={{ fontSize: "1.25rem" }}>🖼️</span>
                                Thêm ảnh
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                    )}

                    {/* Question Text */}
                    <div style={{ marginBottom: "3rem", textAlign: "center" }}>
                        <input
                            type="text"
                            value={question.questionText}
                            onChange={handleQuestionTextChange}
                            placeholder="Nhập câu hỏi của bạn ở đây"
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
                        {question.options.map((option, index) => {
                            const colors = ["#2E77BB", "#18A99D", "#F5A623", "#E84A5F"];
                            const color = colors[index % colors.length];

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
                                        {/* Correct Button */}
                                        <button
                                            onClick={() => {
                                                if (isMultipleAnswers) {
                                                    handleOptionChange(index, "correct", !option.correct);
                                                } else {
                                                    const newOptions = question.options.map((opt) => ({
                                                        ...opt,
                                                        correct: false,
                                                    }));
                                                    newOptions[index].correct = true;
                                                    setQuestion({ ...question, options: newOptions });
                                                }
                                            }}
                                            style={{
                                                position: "absolute",
                                                top: "0.5rem",
                                                right: "0.5rem",
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "50%",
                                                border: "2px solid white",
                                                background: option.correct ? "white" : "transparent",
                                                color: option.correct ? color : "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                fontSize: "16px",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {option.correct ? "✓" : ""}
                                        </button>

                                        {/* Option Text Input */}
                                        <input
                                            type="text"
                                            value={option.optionText}
                                            onChange={(e) =>
                                                handleOptionChange(index, "optionText", e.target.value)
                                            }
                                            placeholder="Đáp án"
                                            style={{
                                                width: "100%",
                                                background: "transparent",
                                                border: "none",
                                                color: "white",
                                                fontSize: "1.1rem",
                                                fontWeight: 600,
                                                textAlign: "center",
                                                outline: "none",
                                            }}
                                        />

                                        {/* Delete Button */}
                                        <button
                                            onClick={() =>
                                                setQuestion({
                                                    ...question,
                                                    options: question.options.filter((_, i) => i !== index),
                                                })
                                            }
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
                        {question.options.length < 5 &&
                            question.questionType === QUESTION_TYPES.MULTIPLE_CHOICE && (
                                <div
                                    style={{
                                        width: "100px",
                                        height: "180px",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setQuestion({
                                                ...question,
                                                options: [
                                                    ...question.options,
                                                    {
                                                        optionId: "",
                                                        optionText: "",
                                                        correct: false,
                                                        correctAnswer: "",
                                                    },
                                                ],
                                            });
                                        }}
                                        style={{
                                            width: "50px",
                                            height: "50px",
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
                            {question.questionType === QUESTION_TYPES.MULTIPLE_CHOICE
                                ? "Nhiều câu trả lời đúng"
                                : "Câu trả lời đúng duy nhất"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionForm;