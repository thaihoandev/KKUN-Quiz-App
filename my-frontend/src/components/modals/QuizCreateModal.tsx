import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuizStatus } from "@/interfaces";
import { createQuiz, createQuizFromFile } from "@/services/quizService";

// Define a type for the quiz creation payload
interface QuizCreatePayload {
  title: string;
  description?: string;
  status: QuizStatus;
  userId?: string;
}

interface UserProfile {
  userId: string;
  email?: string;
}

interface QuizCreateModalProps {
  show: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  loading?: boolean; // Optional parent-controlled loading prop
}

const QuizCreateModal: React.FC<QuizCreateModalProps> = ({
  show,
  onClose,
  profile,
  loading: parentLoading = false, // Fallback to false if not provided
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Combine parentLoading and isLoading to determine loading state
  const effectiveLoading = parentLoading || isLoading;

  useEffect(() => {
    if (show && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !effectiveLoading) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [effectiveLoading, onClose]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setError(null);
    setIsLoading(false); // Reset local loading state
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Quiz title is required");
      return;
    }

    const quizMeta: QuizCreatePayload = {
      title: title.trim(),
      description: description.trim() || "",
      status: QuizStatus.DRAFT,
    };

    try {
      setIsLoading(true); // Set loading state to true
      let createdQuiz;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "quiz",
          new Blob([JSON.stringify(quizMeta)], { type: "application/json" })
        );

        createdQuiz = await createQuizFromFile(formData);
      } else {
        createdQuiz = await createQuiz(quizMeta);
      }

      resetForm();
      navigate(`/quizzes/${createdQuiz?.quizId}`);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Failed to create quiz. Please try again.");
      setIsLoading(false); // Reset loading state on error
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (value.trim()) {
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected?.type !== "application/pdf") {
      setError("Please select a PDF file");
      return;
    }
    setFile(selected);
    setError(null);
  };

  if (!show) return null;

  const isSubmitDisabled = effectiveLoading || !title.trim();

  return (
    <div
      className="modal fade show d-block position-fixed"
      tabIndex={-1}
      style={{
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(5px)",
        zIndex: 1100,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "auto",
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        style={{ maxWidth: "600px", width: "100%", position: "relative" }}
      >
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: "12px", position: "relative" }}
        >
          {/* Loading Overlay */}
          {effectiveLoading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                zIndex: 1103,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "12px",
                transition: "opacity 0.3s ease",
                opacity: effectiveLoading ? 1 : 0,
              }}
            >
              <div
                className="spinner-border text-primary"
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderWidth: "0.4em",
                  animation: "spin 1s linear infinite",
                }}
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p
                className="mt-3 fw-semibold text-dark"
                style={{ fontSize: "1.2rem" }}
              >
                Creating Quiz...
              </p>
            </div>
          )}

          <div
            className="modal-header bg-gradient-primary text-white px-4 py-3 position-relative"
            style={{
              background: "linear-gradient(45deg, #6a11cb, #2575fc)",
              zIndex: 1101,
            }}
          >
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i
                className="bx bx-plus-circle me-2"
                style={{ fontSize: "1.2em" }}
              />
              Create New Quiz
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 mt-2 me-2"
              onClick={onClose}
              disabled={effectiveLoading}
              aria-label="Close"
              style={{ zIndex: 1102, opacity: 0.8, transition: "opacity 0.2s ease" }}
            />
          </div>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="modal-body p-4 bg-light" style={{ backgroundColor: "#f8f9fa" }}>
              <div className="mb-4">
                <label
                  htmlFor="quizFile"
                  className="form-label fw-semibold text-dark mb-2"
                >
                  Upload PDF (optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="form-control shadow-sm"
                  id="quizFile"
                  onChange={handleFileChange}
                  disabled={effectiveLoading}
                />
                <small className="text-muted d-block mt-1">
                  Optional. Upload a PDF to auto-generate questions.
                </small>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="quizTitle"
                  className="form-label fw-semibold text-dark mb-2"
                >
                  Quiz Title
                  <span className="text-danger ms-1">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bx bx-pencil text-muted" />
                  </span>
                  <input
                    ref={titleInputRef}
                    type="text"
                    className="form-control form-control-lg shadow-sm"
                    id="quizTitle"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter a captivating quiz title"
                    disabled={effectiveLoading}
                    maxLength={100}
                    style={{ borderRadius: "0 8px 8px 0" }}
                  />
                </div>
                <small className="text-muted d-block mt-1">
                  {title.length}/100 characters
                </small>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="quizDescription"
                  className="form-label fw-semibold text-dark mb-2"
                >
                  Description
                  <span className="text-muted ms-1 fw-normal">(optional)</span>
                </label>
                <textarea
                  className="form-control shadow-sm"
                  id="quizDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your quiz - what makes it special?"
                  disabled={effectiveLoading}
                  maxLength={500}
                  style={{ resize: "vertical", borderRadius: "8px", backgroundColor: "white" }}
                />
                <small className="text-muted d-block mt-1">
                  {description.length}/500 characters
                </small>
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {error}
                </div>
              )}
            </div>
            <div
              className="modal-footer bg-white px-4 py-3 border-top"
              style={{ borderColor: "#e9ecef" }}
            >
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2 fw-medium"
                onClick={onClose}
                disabled={effectiveLoading}
                style={{ borderRadius: "8px", transition: "all 0.2s ease" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 py-2 fw-medium"
                disabled={isSubmitDisabled}
                style={{
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                  background: "linear-gradient(45deg, #6a11cb, #2575fc)",
                }}
              >
                {effectiveLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                      style={{ borderColor: "white", borderRightColor: "transparent" }}
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bx bx-check me-1" />
                    Create Quiz
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizCreateModal;