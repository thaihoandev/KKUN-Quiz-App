import React, { useState } from "react";

interface AddQuestionByTypeModalProps {
    show: boolean;
    onHide: () => void;
    onAddQuestion: (type: string) => void;
}

const AddQuestionByTypeModal: React.FC<AddQuestionByTypeModalProps> = ({
    show,
    onHide,
    onAddQuestion,
}) => {
    const [selectedType, setSelectedType] = useState<string>("");

    const handleAdd = () => {
        if (selectedType) {
            onAddQuestion(selectedType);
            setSelectedType("");
            onHide();
        }
    };

    const handleClose = () => {
        setSelectedType("");
        onHide();
    };

    const questionTypes = [
        {
            type: "SINGLE_CHOICE",
            label: "Một lựa chọn",
            subtitle: "Single Choice",
            icon: "◉",
            description: "Chọn một đáp án đúng duy nhất"
        },
        {
            type: "MULTIPLE_CHOICE",
            label: "Nhiều lựa chọn",
            subtitle: "Multiple Choice",
            icon: "☑",
            description: "Chọn nhiều đáp án đúng"
        },
        {
            type: "TRUE_FALSE",
            label: "Đúng/Sai",
            subtitle: "True/False",
            icon: "✓✗",
            description: "Câu hỏi đúng hoặc sai"
        },
        {
            type: "FILL_IN_THE_BLANK",
            label: "Điền vào chỗ trống",
            subtitle: "Fill in the Blank",
            icon: "___",
            description: "Nhập câu trả lời văn bản"
        }
    ];

    if (!show) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "var(--overlay-color)",
                backdropFilter: "var(--blur-bg)",
                zIndex: 2000,
                animation: "fadeIn 0.3s ease",
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    maxWidth: "700px",
                    width: "90%",
                    transform: "translateY(10px)",
                    animation: "slideUp 0.35s ease forwards",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        background: "var(--surface-color)",
                        border: "none",
                        borderRadius: "var(--border-radius)",
                        overflow: "hidden",
                        boxShadow: "var(--card-shadow)",
                        position: "relative",
                        color: "var(--text-color)",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            background: "var(--gradient-primary)",
                            borderBottom: "none",
                            padding: "1.5rem",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "1.5rem" }}>📝</span>
                                <h5
                                    style={{
                                        margin: 0,
                                        fontWeight: 700,
                                        fontSize: "1.25rem",
                                        color: "white",
                                    }}
                                >
                                    Chọn loại câu hỏi
                                </h5>
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "0.9rem",
                                    color: "rgba(255, 255, 255, 0.9)",
                                    fontWeight: 400,
                                }}
                            >
                                Chọn định dạng phù hợp cho câu hỏi của bạn
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            aria-label="Close"
                            style={{
                                filter: "brightness(0) invert(1)",
                                flexShrink: 0,
                            }}
                        />
                    </div>

                    {/* Body */}
                    <div style={{ padding: "1.5rem" }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: "1rem",
                            }}
                        >
                            {questionTypes.map((qt) => (
                                <button
                                    key={qt.type}
                                    style={{
                                        padding: "1.25rem",
                                        border: `2px solid ${selectedType === qt.type ? "var(--primary-color)" : "var(--border-color)"}`,
                                        borderRadius: "12px",
                                        background: selectedType === qt.type ? "var(--light-bg)" : "var(--surface-color)",
                                        cursor: "pointer",
                                        transition: "all 0.25s ease",
                                        textAlign: "left",
                                        position: "relative",
                                        boxShadow: selectedType === qt.type ? "0 0 0 3px rgba(96, 165, 250, 0.2)" : "none",
                                    }}
                                    onClick={() => setSelectedType(qt.type)}
                                    onMouseEnter={(e) => {
                                        if (selectedType !== qt.type) {
                                            e.currentTarget.style.borderColor = "var(--primary-color)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(96, 165, 250, 0.15)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedType !== qt.type) {
                                            e.currentTarget.style.borderColor = "var(--border-color)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }
                                    }}
                                >
                                    {selectedType === qt.type && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "0.75rem",
                                                right: "0.75rem",
                                                width: "24px",
                                                height: "24px",
                                                borderRadius: "50%",
                                                background: "var(--gradient-primary)",
                                                color: "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "14px",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            ✓
                                        </div>
                                    )}
                                    <div style={{ display: "flex", alignItems: "start", gap: "1rem" }}>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "8px",
                                                background: selectedType === qt.type ? "var(--gradient-primary)" : "var(--surface-alt)",
                                                color: selectedType === qt.type ? "white" : "var(--primary-color)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "24px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {qt.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontWeight: "bold",
                                                    marginBottom: "0.25rem",
                                                    color: "var(--text-color)",
                                                    fontSize: "1rem",
                                                }}
                                            >
                                                {qt.label}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.85rem",
                                                    color: "var(--text-muted)",
                                                    fontWeight: 500,
                                                    marginBottom: "0.25rem",
                                                }}
                                            >
                                                {qt.subtitle}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.8rem",
                                                    color: "var(--text-light)",
                                                }}
                                            >
                                                {qt.description}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1rem",
                            padding: "1rem 1.5rem",
                            background: "var(--surface-alt)",
                            borderTop: "1px solid var(--border-color)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleClose}
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
                                e.currentTarget.style.borderColor = "var(--text-color)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.borderColor = "var(--border-color)";
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!selectedType}
                            style={{
                                padding: "0.75rem 1.5rem",
                                border: "none",
                                borderRadius: "10px",
                                background: "var(--gradient-primary)",
                                color: "white",
                                fontWeight: 600,
                                cursor: !selectedType ? "not-allowed" : "pointer",
                                opacity: !selectedType ? 0.5 : 1,
                                transition: "all 0.25s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                            onMouseEnter={(e) => {
                                if (selectedType) {
                                    e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <span>✓</span>
                            <span>Thêm câu hỏi</span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default AddQuestionByTypeModal;