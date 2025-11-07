import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { QuizStatus } from "@/interfaces";
import { createQuiz, createQuizFromFile } from "@/services/quizService";
import { UserProfile } from "@/types/users";

/* ======================================================
   📘 CreateQuizButton — Portal-based modal trigger
====================================================== */

interface CreateQuizButtonProps {
  profile: UserProfile | null;
  disabled?: boolean;
}

const CreateQuizButton: React.FC<CreateQuizButtonProps> = ({ profile, disabled = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary shadow-quiz d-flex align-items-center gap-2 animate-slide-in"
        disabled={disabled}
      >
        <i className="bx bx-edit-alt fs-5"></i>
        <span className="fw-semibold">Create New Quiz</span>
      </button>

      {open && <QuizCreateModal open={open} onClose={() => setOpen(false)} profile={profile} />}
    </>
  );
};

export default CreateQuizButton;

/* ======================================================
   🧩 QuizCreateModal — Modern UI with default close btn
====================================================== */

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
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 2000,
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        style={{
          maxWidth: "600px",
          width: "100%",
          transform: "translateY(10px)",
          animation: "slideUp 0.35s ease forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-quiz rounded-4 overflow-hidden bg-surface position-relative ">
          {/* Header */}
          <div
            className="modal-header border-0"
            style={{
              background: "linear-gradient(120deg, #6366f1, #3b82f6)",
            }}
          >
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
              <i className="bx bx-plus-circle fs-5"></i> Create New Quiz
            </h5>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="modal-body p-4">
              <div className="mb-4">
                <label htmlFor="quizFile" className="form-label fw-semibold">
                  Upload PDF (optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  id="quizFile"
                  className="form-control"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <small className="text-muted">
                  Optional — upload a PDF to auto-generate questions.
                </small>
              </div>

              <div className="mb-4">
                <label htmlFor="quizTitle" className="form-label fw-semibold">
                  Quiz Title <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-surface">
                    <i className="bx bx-pencil text-muted"></i>
                  </span>
                  <input
                    id="quizTitle"
                    ref={titleRef}
                    type="text"
                    className="form-control"
                    placeholder="Enter quiz title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
                <small className="text-muted">{title.length}/100 characters</small>
              </div>

              <div className="mb-4">
                <label htmlFor="quizDescription" className="form-label fw-semibold">
                  Description <span className="text-muted fw-normal">(optional)</span>
                </label>
                <textarea
                  id="quizDescription"
                  className="form-control"
                  rows={4}
                  placeholder="Describe your quiz briefly..."
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
                <small className="text-muted">{description.length}/500 characters</small>
              </div>

              {error && <div className="alert alert-danger shadow-sm">{error}</div>}
            </div>

            {/* Footer */}
            <div className="modal-footer bg-surface border-top mx-2">
              <button
                type="button"
                className="btn btn-outline-secondary fw-medium px-4"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary fw-medium px-4"
                disabled={loading || !title.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bx bx-check me-1" /> Create Quiz
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Loading overlay */}
          {loading && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center bg-light bg-opacity-75"
              style={{ zIndex: 2200, borderRadius: "inherit" }}
            >
              <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} />
              <p className="fw-semibold text-primary">Creating Quiz...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};
