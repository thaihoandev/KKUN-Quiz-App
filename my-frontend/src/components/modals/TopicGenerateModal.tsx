import React, { useState, useEffect } from "react";
import { TopicGenerateRequest } from "@/services/quizService";

type Props = {
  open: boolean;
  loading?: boolean;
  initial?: Partial<TopicGenerateRequest>;
  onCancel: () => void;
  onSubmit: (payload: TopicGenerateRequest) => void;
};

const TopicGenerateModal: React.FC<Props> = ({ 
  open, 
  loading, 
  initial, 
  onCancel, 
  onSubmit 
}) => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [questionType, setQuestionType] = useState<"AUTO" | "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE">("AUTO");
  const [timeLimit, setTimeLimit] = useState(10);
  const [points, setPoints] = useState(1000);
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setTopic(initial?.topic ?? "");
      setCount(initial?.count ?? 5);
      setQuestionType((initial?.questionType as "AUTO" | "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE") ?? "AUTO");
      setTimeLimit(initial?.timeLimit ?? 10);
      setPoints(initial?.points ?? 1000);
      setLanguage((initial?.language as "vi" | "en") ?? "vi");
      setErrors({});
    }
  }, [open, initial]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!topic.trim()) {
      newErrors.topic = "Nhập chủ đề!";
    } else if (topic.length > 300) {
      newErrors.topic = "Tối đa 300 ký tự";
    }

    if (count < 1 || count > 10) {
      newErrors.count = "1–10 câu mỗi lần";
    }

    if (timeLimit < 5 || timeLimit > 300) {
      newErrors.timeLimit = "Trong khoảng 5–300 giây";
    }

    if (points < 1 || points > 100000) {
      newErrors.points = "Điểm phải từ 1 đến 100000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (loading) return;
    
    if (!validateForm()) return;

    const payload: TopicGenerateRequest = {
      topic: topic.trim(),
      count,
      questionType,
      timeLimit,
      points,
      language,
    };

    onSubmit(payload);
  };

  const handleClose = () => {
    if (loading) return;
    onCancel();
  };

  if (!open) return null;

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
      onClick={loading ? undefined : handleClose}
    >
      <div
        style={{
          maxWidth: "600px",
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🤖</span>
                <h5
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "white",
                  }}
                >
                  Sinh câu hỏi theo chủ đề (AI)
                </h5>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              style={{
                filter: "brightness(0) invert(1)",
                flexShrink: 0,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: "1.5rem", maxHeight: "70vh", overflowY: "auto" }}>
            {/* Topic */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Chủ đề <span style={{ color: "var(--danger-color)" }}>*</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                placeholder='VD: "Java OOP", "HTTP cơ bản", "Địa lý Việt Nam"...'
                rows={3}
                className="form-control"
                style={{
                  resize: "vertical",
                  minHeight: "80px",
                  color: "var(--text-color)",
                }}
              />
              {errors.topic && (
                <small style={{ color: "var(--danger-color)", display: "block", marginTop: "0.25rem" }}>
                  {errors.topic}
                </small>
              )}
            </div>

            {/* Count */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Số câu
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={loading}
                min={1}
                max={10}
                className="form-control"
                style={{ color: "var(--text-color)" }}
              />
              {errors.count && (
                <small style={{ color: "var(--danger-color)", display: "block", marginTop: "0.25rem" }}>
                  {errors.count}
                </small>
              )}
              <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                Tối đa 10 câu mỗi lần
              </small>
            </div>

            {/* Question Type */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Loại câu hỏi
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as "AUTO" | "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE")}
                disabled={loading}
                className="form-select"
                style={{ color: "var(--text-color)" }}
              >
                <option value="AUTO">Tự chọn (AUTO)</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              </select>
            </div>

            {/* Time Limit */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Thời gian mỗi câu (giây)
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                disabled={loading}
                min={5}
                max={300}
                className="form-control"
                style={{ color: "var(--text-color)" }}
              />
              {errors.timeLimit && (
                <small style={{ color: "var(--danger-color)", display: "block", marginTop: "0.25rem" }}>
                  {errors.timeLimit}
                </small>
              )}
              <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                Trong khoảng 5–300 giây
              </small>
            </div>

            {/* Points */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Điểm mỗi câu
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                disabled={loading}
                min={1}
                max={100000}
                step={100}
                className="form-control"
                style={{ color: "var(--text-color)" }}
              />
              {errors.points && (
                <small style={{ color: "var(--danger-color)", display: "block", marginTop: "0.25rem" }}>
                  {errors.points}
                </small>
              )}
            </div>

            {/* Language */}
            <div style={{ marginBottom: "0" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Ngôn ngữ
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "vi" | "en")}
                disabled={loading}
                className="form-select"
                style={{ color: "var(--text-color)" }}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              padding: "1rem 1.5rem",
              background: "var(--surface-alt)",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                border: "2px solid var(--border-color)",
                borderRadius: "10px",
                background: "transparent",
                color: "var(--text-color)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--surface-color)";
                  e.currentTarget.style.borderColor = "var(--text-color)";
                }
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
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "10px",
                background: "var(--gradient-primary)",
                color: "white",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.25s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span>Đang sinh...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Sinh câu hỏi</span>
                </>
              )}
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

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default TopicGenerateModal;