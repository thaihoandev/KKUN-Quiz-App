import React, {useState, useEffect} from "react";
import {
    DEFAULT_POINTS,
    DEFAULT_QUESTION_TYPE,
    DEFAULT_TIME_LIMIT,
    POINTS_OPTIONS,
    QUESTION_TYPE_LABELS,
    QUESTION_TYPES,
    TIME_LIMIT_OPTIONS,
} from "@/constants/quizConstants";
import {Option, Question} from "@/interfaces";

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
                        {
                            optionId: "",
                            optionText: "",
                            correct: true,
                            correctAnswer: "",
                        },
                        {
                            optionId: "",
                            optionText: "",
                            correct: false,
                            correctAnswer: "",
                        },
                        {
                            optionId: "",
                            optionText: "",
                            correct: false,
                            correctAnswer: "",
                        },
                        {
                            optionId: "",
                            optionText: "",
                            correct: false,
                            correctAnswer: "",
                        },
                    ],
                };
            case QUESTION_TYPES.TRUE_FALSE:
                return {
                    ...baseQuestion,
                    questionText: "Câu hỏi mới (Đúng/Sai)",
                    options: [
                        {
                            optionId: "",
                            optionText: "Đúng",
                            correct: true,
                            correctAnswer: "Đúng",
                        },
                        {
                            optionId: "",
                            optionText: "Sai",
                            correct: false,
                            correctAnswer: "",
                        },
                    ],
                };
            case QUESTION_TYPES.FILL_IN_THE_BLANK:
                return {
                    ...baseQuestion,
                    questionText: "Câu hỏi mới (Điền vào chỗ trống)",
                    options: [
                        {
                            optionId: "",
                            optionText: "",
                            correct: true,
                            correctAnswer: "",
                        },
                    ],
                };
            case QUESTION_TYPES.SINGLE_CHOICE:
                return {
                    ...baseQuestion,
                    questionText: "Câu hỏi mới (Một lựa chọn)",
                    options: [
                        {
                            optionId: "",
                            optionText: "",
                            correct: true,
                            correctAnswer: "",
                        },
                        {
                            optionId: "",
                            optionText: "",
                            correct: false,
                            correctAnswer: "",
                        },
                        {
                            optionId: "",
                            optionText: "",
                            correct: false,
                            correctAnswer: "",
                        },
                        {
                            optionId: "",
                            optionText: "",
                            correct: false,
                            correctAnswer: "",
                        },
                    ],
                };
            default:
                return baseQuestion;
        }
    };

    // Khởi tạo question từ initialQuestion hoặc tạo question mới theo initialQuestionType hoặc mặc định
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
        return createDefaultQuestion(
            initialQuestionType || DEFAULT_QUESTION_TYPE,
        );
    });

    // Cập nhật question khi loại câu hỏi thay đổi
    const handleQuestionTypeChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const newType = e.target.value as Question["questionType"];

        if (isCreateMode || question.options.length === 0) {
            setQuestion(createDefaultQuestion(newType));
        } else {
            setQuestion({
                ...question,
                questionType: newType,
            });
        }
    };

    const handleQuestionTextChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setQuestion({...question, questionText: e.target.value});
    };

    const handleOptionChange = (
        index: number, // Thay optionId bằng index
        field: keyof Option,
        value: string | boolean,
    ) => {
        const newOptions = question.options.map((option, i) =>
            i === index ? {...option, [field]: value} : option,
        );
        setQuestion({...question, options: newOptions});
    };

    const handleTimeLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQuestion({...question, timeLimit: parseInt(e.target.value)});
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQuestion({...question, points: parseInt(e.target.value)});
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const imageUrl = URL.createObjectURL(file);
            setQuestion({...question, imageUrl});
        }
    };

    const handleSaveQuestion = async () => {
        const formData = new FormData();
        formData.append(
            "question",
            new Blob([JSON.stringify(question)], {type: "application/json"}),
        );
        if (imageFile) {
            formData.append("image", imageFile);
        }
        await onSave(formData);
    };

    const isMultipleAnswers =
        question.questionType === QUESTION_TYPES.MULTIPLE_CHOICE;

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <button
                    className="btn btn-outline-secondary"
                    onClick={onCancel}
                >
                    ← Quay lại
                </button>
                <div className="d-flex gap-2 align-items-center">
                    <div className="dropdown">
                        <select
                            className="form-select"
                            value={question.questionType}
                            onChange={handleQuestionTypeChange}
                        >
                            {Object.values(QUESTION_TYPES).map((type) => (
                                <option key={type} value={type}>
                                    {QUESTION_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="me-2">⏱️</span>
                        <select
                            className="form-select"
                            value={question.timeLimit}
                            onChange={handleTimeLimitChange}
                        >
                            {TIME_LIMIT_OPTIONS.map((seconds) => (
                                <option key={seconds} value={seconds}>
                                    {seconds} giây
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="me-2">🏆</span>
                        <select
                            className="form-select"
                            value={question.points}
                            onChange={handlePointsChange}
                        >
                            {POINTS_OPTIONS.map((point) => (
                                <option key={point} value={point}>
                                    {point} điểm
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleSaveQuestion}
                    >
                        {isCreateMode ? "Tạo câu hỏi" : "Lưu câu hỏi"}
                    </button>
                </div>
            </div>

            <div
                className="card p-4 bg-dark text-white rounded-4"
                style={{backgroundColor: "#2D0A40"}}
            >
                <div className="card-body">
                    {question.imageUrl && (
                        <div className="text-center mb-3">
                            <img
                                src={question.imageUrl}
                                alt="Question image"
                                className="img-fluid mb-2"
                                style={{maxHeight: "200px"}}
                            />
                            <button
                                className="btn btn-sm btn-outline-light"
                                onClick={() => {
                                    setImageFile(null);
                                    setQuestion({
                                        ...question,
                                        imageUrl: undefined,
                                    });
                                }}
                            >
                                Xóa ảnh
                            </button>
                        </div>
                    )}

                    {!question.imageUrl && (
                        <div className="text-center mb-3">
                            <label className="btn btn-outline-light">
                                <i className="bx bx-image-add"></i> Thêm ảnh
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{display: "none"}}
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                    )}

                    <div className="mb-5 text-center">
                        <input
                            type="text"
                            className="form-control bg-transparent text-white border-light text-center fs-3"
                            value={question.questionText}
                            onChange={handleQuestionTextChange}
                            placeholder="Nhập câu hỏi của bạn ở đây"
                            style={{
                                border: "none",
                                borderBottom: "1px solid rgba(255,255,255,0.2)",
                            }}
                        />
                    </div>

                    <div className="d-flex flex-wrap gap-3 justify-content-center mt-5">
                        {question.options.map((option, index) => {
                            const colors = [
                                "#2E77BB",
                                "#18A99D",
                                "#F5A623",
                                "#E84A5F",
                            ];
                            const color = colors[index % colors.length];

                            return (
                                <div
                                    key={index} // Dùng index làm key tạm thời trong chế độ tạo mới
                                    className="position-relative"
                                    style={{width: "220px", height: "180px"}}
                                >
                                    <div
                                        className="card p-3 d-flex justify-content-center align-items-center h-100 position-relative"
                                        style={{
                                            backgroundColor: color,
                                            borderRadius: "10px",
                                        }}
                                    >
                                        <button
                                            className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle"
                                            onClick={() => {
                                                if (isMultipleAnswers) {
                                                    handleOptionChange(
                                                        index,
                                                        "correct",
                                                        !option.correct,
                                                    );
                                                } else {
                                                    const newOptions =
                                                        question.options.map(
                                                            (opt) => ({
                                                                ...opt,
                                                                correct: false,
                                                            }),
                                                        );
                                                    newOptions[index].correct =
                                                        true;
                                                    setQuestion({
                                                        ...question,
                                                        options: newOptions,
                                                    });
                                                }
                                            }}
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: 0,
                                            }}
                                        >
                                            {option.correct ? "✓" : ""}
                                        </button>
                                        <input
                                            type="text"
                                            className="form-control text-center bg-transparent text-white border-0 fs-5"
                                            value={option.optionText}
                                            onChange={(e) =>
                                                handleOptionChange(
                                                    index,
                                                    "optionText",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Đáp án"
                                            style={{boxShadow: "none"}}
                                        />
                                        <button
                                            className="btn btn-sm btn-outline-light position-absolute bottom-0 end-0 m-2"
                                            onClick={() =>
                                                setQuestion({
                                                    ...question,
                                                    options:
                                                        question.options.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                })
                                            }
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: 0,
                                                borderRadius: "4px",
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {question.options.length < 5 &&
                            question.questionType ===
                                QUESTION_TYPES.MULTIPLE_CHOICE && (
                                <div
                                    className="d-flex justify-content-center align-items-center"
                                    style={{width: "100px", height: "180px"}}
                                >
                                    <button
                                        className="btn btn-outline-light rounded-circle"
                                        onClick={() => {
                                            setQuestion({
                                                ...question,
                                                options: [
                                                    ...question.options,
                                                    {
                                                        optionId: "", // Giữ rỗng vì đây là chế độ tạo mới
                                                        optionText: "",
                                                        correct: false,
                                                        correctAnswer: "",
                                                    },
                                                ],
                                            });
                                        }}
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                    </div>

                    <div className="d-flex mt-4 justify-content-start">
                        <div className="px-3 py-1 bg-dark text-white rounded-pill">
                            {question.questionType ===
                            QUESTION_TYPES.MULTIPLE_CHOICE
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
