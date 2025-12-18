import React, { useState } from "react";

interface AddQuestionByTypeModalProps {
    show: boolean;
    onHide: () => void;
    onAddQuestion: (type: string) => void;
}

interface QuestionTypeCardProps {
    qt: {
        type: string;
        label: string;
        subtitle: string;
        icon: string;
        description: string;
        gradient: string;
    };
    isSelected: boolean;
    onClick: () => void;
}

const QuestionTypeCard: React.FC<QuestionTypeCardProps> = ({ qt, isSelected, onClick }) => {
    return (
        <button
            style={{
                padding: "1.25rem",
                border: `2px solid ${isSelected ? "transparent" : "#e5e7eb"}`,
                borderRadius: "14px",
                background: isSelected ? qt.gradient : "white",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: "left",
                position: "relative",
                boxShadow: isSelected 
                    ? "0 8px 24px rgba(102, 126, 234, 0.35)" 
                    : "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.borderColor = "#667eea";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)";
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
                }
            }}
        >
            {isSelected && (
                <div
                    style={{
                        position: "absolute",
                        top: "0.875rem",
                        right: "0.875rem",
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.95)",
                        color: "#667eea",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: "bold",
                        animation: "checkmarkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    ✓
                </div>
            )}
            <div style={{ display: "flex", alignItems: "start", gap: "0.875rem" }}>
                <div
                    style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: isSelected 
                            ? "rgba(255, 255, 255, 0.25)" 
                            : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                        color: isSelected ? "white" : "#667eea",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        flexShrink: 0,
                        backdropFilter: isSelected ? "blur(10px)" : "none",
                        transition: "all 0.3s ease",
                    }}
                >
                    {qt.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontWeight: 700,
                            marginBottom: "0.25rem",
                            color: isSelected ? "white" : "#1f2937",
                            fontSize: "1rem",
                            letterSpacing: "-0.3px",
                        }}
                    >
                        {qt.label}
                    </div>
                    <div
                        style={{
                            fontSize: "0.8rem",
                            color: isSelected ? "rgba(255, 255, 255, 0.85)" : "#6b7280",
                            fontWeight: 500,
                            marginBottom: "0.375rem",
                        }}
                    >
                        {qt.subtitle}
                    </div>
                    <div
                        style={{
                            fontSize: "0.8rem",
                            color: isSelected ? "rgba(255, 255, 255, 0.75)" : "#9ca3af",
                            lineHeight: "1.4",
                        }}
                    >
                        {qt.description}
                    </div>
                </div>
            </div>
        </button>
    );
};

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
            description: "Chọn một đáp án đúng duy nhất",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            popular: true
        },
        {
            type: "MULTIPLE_CHOICE",
            label: "Nhiều lựa chọn",
            subtitle: "Multiple Choice",
            icon: "☑",
            description: "Chọn nhiều đáp án đúng",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            popular: true
        },
        {
            type: "TRUE_FALSE",
            label: "Đúng/Sai",
            subtitle: "True/False",
            icon: "✓✗",
            description: "Câu hỏi đúng hoặc sai",
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            popular: true
        },
        {
            type: "FILL_IN_THE_BLANK",
            label: "Điền vào chỗ trống",
            subtitle: "Fill in the Blank",
            icon: "___",
            description: "Nhập câu trả lời văn bản",
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            popular: true
        },
        {
            type: "SHORT_ANSWER",
            label: "Trả lời ngắn",
            subtitle: "Short Answer",
            icon: "✍",
            description: "Trả lời bằng văn bản ngắn gọn",
            gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        },
        {
            type: "ESSAY",
            label: "Tự luận",
            subtitle: "Essay",
            icon: "📝",
            description: "Trả lời chi tiết dạng bài luận",
            gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        },
        {
            type: "MATCHING",
            label: "Ghép cặp",
            subtitle: "Matching",
            icon: "⟷",
            description: "Ghép các cặp câu trả lời tương ứng",
            gradient: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)"
        },
        {
            type: "ORDERING",
            label: "Sắp xếp thứ tự",
            subtitle: "Ordering",
            icon: "⇅",
            description: "Sắp xếp các mục theo đúng thứ tự",
            gradient: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)"
        },
        {
            type: "DRAG_DROP",
            label: "Kéo thả",
            subtitle: "Drag & Drop",
            icon: "⤿",
            description: "Kéo và thả vào vị trí đúng",
            gradient: "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)"
        },
        {
            type: "HOTSPOT",
            label: "Điểm nóng",
            subtitle: "Hotspot",
            icon: "📍",
            description: "Chọn vị trí đúng trên hình ảnh",
            gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
        },
        {
            type: "IMAGE_SELECTION",
            label: "Chọn hình ảnh",
            subtitle: "Image Selection",
            icon: "🖼",
            description: "Chọn hình ảnh đúng",
            gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
        },
        {
            type: "DROPDOWN",
            label: "Chọn từ menu",
            subtitle: "Dropdown",
            icon: "▼",
            description: "Chọn đáp án từ menu thả xuống",
            gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"
        },
        {
            type: "MATRIX",
            label: "Ma trận",
            subtitle: "Matrix",
            icon: "⊞",
            description: "Chọn đáp án trong bảng ma trận",
            gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
        },
        {
            type: "RANKING",
            label: "Xếp hạng",
            subtitle: "Ranking",
            icon: "★",
            description: "Xếp hạng theo thứ tự ưu tiên",
            gradient: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)"
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
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
                zIndex: 2000,
                animation: "fadeIn 0.25s ease",
                padding: "1rem",
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    maxWidth: "800px",
                    width: "100%",
                    animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        background: "white",
                        borderRadius: "20px",
                        overflow: "hidden",
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                        position: "relative",
                    }}
                >
                    {/* Header với gradient */}
                    <div
                        style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            padding: "2rem 2rem 1.5rem 2rem",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Decorative circles */}
                        <div style={{
                            position: "absolute",
                            top: "-50px",
                            right: "-50px",
                            width: "150px",
                            height: "150px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.1)",
                        }} />
                        <div style={{
                            position: "absolute",
                            bottom: "-30px",
                            left: "-30px",
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.1)",
                        }} />

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "0.75rem", 
                                    }}>
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "12px",
                                            background: "rgba(255, 255, 255, 0.2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "24px",
                                            backdropFilter: "blur(10px)",
                                        }}>
                                            📝
                                        </div>
                                        <h2
                                            style={{
                                                margin: 0,
                                                fontWeight: 700,
                                                fontSize: "1.75rem",
                                                color: "white",
                                                letterSpacing: "-0.5px",
                                            }}
                                        >
                                            Chọn loại câu hỏi
                                        </h2>
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "1rem",
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
                                    onClick={handleClose}
                                    aria-label="Close"
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "10px",
                                        border: "none",
                                        background: "rgba(255, 255, 255, 0.2)",
                                        color: "white",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "20px",
                                        transition: "all 0.2s ease",
                                        flexShrink: 0,
                                        backdropFilter: "blur(10px)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                                        e.currentTarget.style.transform = "scale(1.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                                        e.currentTarget.style.transform = "scale(1)";
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "2rem" }}>
                        {/* Popular types section */}
                        <div style={{ marginBottom: "2rem" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "1rem",
                            }}>
                                <span style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    color: "#667eea",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>
                                    ⭐ Phổ biến
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                    gap: "1rem",
                                }}
                            >
                                {questionTypes.filter(qt => qt.popular).map((qt) => {
                                    const isSelected = selectedType === qt.type;
                                    return (
                                        <QuestionTypeCard
                                            key={qt.type}
                                            qt={qt}
                                            isSelected={isSelected}
                                            onClick={() => setSelectedType(qt.type)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* All other types */}
                        <div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "1rem",
                            }}>
                                <span style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>
                                    📚 Tất cả loại câu hỏi
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                    gap: "1rem",
                                    height: "260px",        // 👈 chiều cao cố định (tuỳ bạn)
                                    overflowY: "auto",      // 👈 bật scroll dọc
                                    paddingRight: "8px"     // 👈 tránh thanh scroll đè nội dung (optional)
                                }}
                                >
                                {questionTypes.filter(qt => !qt.popular).map((qt) => {
                                    const isSelected = selectedType === qt.type;
                                    return (
                                        <QuestionTypeCard
                                            key={qt.type}
                                            qt={qt}
                                            isSelected={isSelected}
                                            onClick={() => setSelectedType(qt.type)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "1rem 2rem",
                            background: "#f9fafb",
                            borderTop: "1px solid #e5e7eb",
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                padding: "0.875rem 2rem",
                                border: "2px solid #e5e7eb",
                                borderRadius: "12px",
                                background: "white",
                                color: "#6b7280",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                fontSize: "1rem",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f9fafb";
                                e.currentTarget.style.borderColor = "#9ca3af";
                                e.currentTarget.style.color = "#374151";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.borderColor = "#e5e7eb";
                                e.currentTarget.style.color = "#6b7280";
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!selectedType}
                            style={{
                                padding: "0.875rem 2.5rem",
                                border: "none",
                                borderRadius: "12px",
                                background: !selectedType 
                                    ? "#e5e7eb" 
                                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                fontWeight: 600,
                                cursor: !selectedType ? "not-allowed" : "pointer",
                                opacity: !selectedType ? 0.6 : 1,
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "1rem",
                            }}
                            onMouseEnter={(e) => {
                                if (selectedType) {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.4)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
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
                        transform: translateY(40px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes checkmarkPop {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddQuestionByTypeModal;