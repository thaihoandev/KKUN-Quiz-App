import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { QuizStatus } from "@/interfaces";
import { createQuiz, createQuizFromFile } from "@/services/quizService";
import { UserProfile } from "@/types/users";

interface QuizCreateModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

const QuizCreateModal: React.FC<QuizCreateModalProps> = ({ open, onClose, profile }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const modalRoot = document.getElementById("modal-root") || document.body;

  useEffect(() => {
    if (open && titleRef.current) titleRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [loading, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Quiz title is required.");
      return;
    }

    try {
      setLoading(true);
      const quizMeta = {
        title: title.trim(),
        description: description.trim(),
        status: QuizStatus.DRAFT,
        userId: profile?.userId,
      };

      let createdQuiz;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("quiz", new Blob([JSON.stringify(quizMeta)], { type: "application/json" }));
        createdQuiz = await createQuizFromFile(formData);
      } else {
        createdQuiz = await createQuiz(quizMeta);
      }

      navigate(`/quizzes/${createdQuiz.quizId}`);
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create quiz. Please try again.");
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }
    setFile(selected);
    setError(null);
  };

  const modalContent = (
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
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
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
              alignItems: "center",
              gap: "0.75rem",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.25rem" }}>➕</span>
              <h5
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "white",
                }}
              >
                Create New Quiz
              </h5>
            </div>
            
            {/* Close Button */}
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div style={{ padding: "1.5rem" }}>
              {/* File Upload */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="quizFile"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                  }}
                >
                  Upload PDF (optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  id="quizFile"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "var(--surface-color)",
                    color: "var(--text-color)",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "border-color 0.25s ease",
                    outline: "none",
                  }}
                  onChange={handleFileChange}
                  disabled={loading}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary-color)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.5rem" }}>
                  Optional — upload a PDF to auto-generate questions.
                </small>
              </div>

              {/* Title Input */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="quizTitle"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                  }}
                >
                  Quiz Title <span style={{ color: "var(--danger-color)" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span
                    style={{
                      padding: "0.75rem 1rem",
                      background: "var(--surface-alt)",
                      borderRadius: "10px 0 0 10px",
                      border: "2px solid var(--border-color)",
                      borderRight: "none",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    ✏️
                  </span>
                  <input
                    id="quizTitle"
                    ref={titleRef}
                    type="text"
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      border: "2px solid var(--border-color)",
                      borderRadius: "0 10px 10px 0",
                      background: "var(--surface-color)",
                      color: "var(--text-color)",
                      fontSize: "14px",
                      transition: "all 0.25s ease",
                      outline: "none",
                    }}
                    placeholder="Enter quiz title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    maxLength={100}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary-color)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                      e.currentTarget.parentElement!.querySelector("span")!.style.borderColor =
                        "var(--primary-color)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.parentElement!.querySelector("span")!.style.borderColor =
                        "var(--border-color)";
                    }}
                  />
                </div>
                <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.5rem" }}>
                  {title.length}/100 characters
                </small>
              </div>

              {/* Description Textarea */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="quizDescription"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                  }}
                >
                  Description <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  id="quizDescription"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "var(--surface-color)",
                    color: "var(--text-color)",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    minHeight: "120px",
                    transition: "all 0.25s ease",
                    outline: "none",
                  }}
                  rows={4}
                  placeholder="Describe your quiz briefly..."
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary-color)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.5rem" }}>
                  {description.length}/500 characters
                </small>
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--danger-color)",
                    color: "white",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {error}
                </div>
              )}
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
                onClick={onClose}
                disabled={loading}
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
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "10px",
                  background: "var(--gradient-primary)",
                  color: "white",
                  fontWeight: 600,
                  cursor: loading || !title.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !title.trim() ? 0.5 : 1,
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                disabled={loading || !title.trim()}
                onMouseEnter={(e) => {
                  if (!loading && title.trim()) {
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
                <span>{loading ? "Creating..." : "Create Quiz"}</span>
              </button>
            </div>
          </form>

          {/* Loading Overlay */}
          {loading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(0, 0, 0, 0.7)",
                zIndex: 2200,
                borderRadius: "inherit",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid rgba(255, 255, 255, 0.2)",
                  borderTop: "4px solid var(--primary-color)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "1rem",
                }}
              />
              <p
                style={{
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                }}
              >
                Creating Quiz...
              </p>
            </div>
          )}
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

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export { QuizCreateModal };