import { useState, useEffect } from "react";
import { Quiz } from "@/interfaces";
import { getPublishedQuizzes } from "@/services/quizService";
import ProcessQuizCard from "../cards/ProcessQuizCard";

interface QuizListSectionProps {
  initialPage?: number;
  pageSize?: number;
}

const QuizListSection = ({
  initialPage = 0,
  pageSize = 6,
}: QuizListSectionProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const response = await getPublishedQuizzes(
          currentPage,
          pageSize,
          "recommendationScore,desc"
        );
        if (response) {
          setQuizzes(response.content);
          setTotalPages(response.totalPages);
        }
      } catch (e) {
        console.error("Failed to fetch quizzes:", e);
        setQuizzes([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div
      className="card mb-6 border-0 shadow-sm rounded-4"
      style={{
        background: "var(--surface-color)",
        transition: "background 0.25s ease",
      }}
    >
      {/* Card Header */}
      <div
        className="card-header d-flex flex-wrap justify-content-between align-items-end gap-3 border-0"
        style={{
          background: "transparent",
          borderBottom: "2px solid var(--border-color)",
          transition: "border-color 0.25s ease",
        }}
      >
        <div>
          <h4
            className="mb-1 fw-bold"
            style={{
              color: "var(--text-color)",
              fontSize: "1.5rem",
              transition: "color 0.25s ease",
            }}
          >
            ⭐ Recommended Quizzes
          </h4>
          <small
            style={{
              color: "var(--text-muted)",
              transition: "color 0.25s ease",
            }}
          >
            {loading ? "Loading…" : `Showing ${quizzes.length} item(s)`}
          </small>
        </div>

        {/* Header Pagination */}
        {totalPages > 1 && (
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(0)}
              aria-label="First page"
              title="First page"
              style={{
                transition: "all 0.25s ease",
              }}
            >
              <i className="bx bx-chevrons-left" style={{ fontSize: "1rem" }} />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous page"
              title="Previous page"
              style={{
                transition: "all 0.25s ease",
              }}
            >
              <i className="bx bx-chevron-left" style={{ fontSize: "1rem" }} />
            </button>

            <span
              className="small"
              style={{
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                transition: "color 0.25s ease",
              }}
            >
              Page <strong style={{ color: "var(--text-color)" }}>{currentPage + 1}</strong> /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next page"
              title="Next page"
              style={{
                transition: "all 0.25s ease",
              }}
            >
              <i className="bx bx-chevron-right" style={{ fontSize: "1rem" }} />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(totalPages - 1)}
              aria-label="Last page"
              title="Last page"
              style={{
                transition: "all 0.25s ease",
              }}
            >
              <i className="bx bx-chevrons-right" style={{ fontSize: "1rem" }} />
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body pt-2">
        {loading ? (
          // Loading State - Skeleton
          <div className="row gy-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-4">
                <div
                  className="card rounded-3 border-0 shadow-sm"
                  style={{
                    background: "var(--surface-alt)",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                >
                  <div className="card-body">
                    <div className="placeholder-glow">
                      <div
                        className="placeholder col-8 mb-2"
                        style={{
                          backgroundColor: "var(--border-color)",
                          height: "14px",
                        }}
                      />
                      <div
                        className="placeholder col-6 mb-2"
                        style={{
                          backgroundColor: "var(--border-color)",
                          height: "12px",
                        }}
                      />
                      <div
                        className="placeholder col-10 mb-2"
                        style={{
                          backgroundColor: "var(--border-color)",
                          height: "12px",
                        }}
                      />
                      <div
                        className="placeholder col-7 mb-2"
                        style={{
                          backgroundColor: "var(--border-color)",
                          height: "12px",
                        }}
                      />
                      <div className="d-flex gap-2 mt-3">
                        <span
                          className="placeholder col-3"
                          style={{
                            backgroundColor: "var(--border-color)",
                            height: "20px",
                          }}
                        />
                        <span
                          className="placeholder col-4"
                          style={{
                            backgroundColor: "var(--border-color)",
                            height: "20px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          // Empty State
          <div
            className="text-center py-5"
            style={{
              color: "var(--text-muted)",
              transition: "color 0.25s ease",
            }}
          >
            <i
              className="bx bx-notepad"
              style={{
                fontSize: "3rem",
                display: "block",
                marginBottom: "1rem",
                opacity: 0.6,
              }}
            />
            <p style={{ margin: 0, fontSize: "1rem" }}>
              No quizzes available right now.
            </p>
          </div>
        ) : (
          // Quizzes Grid
          <div className="row g-4">
            {quizzes.map((quiz, index) => (
              <div 
                key={quiz.quizId}
                className="col-12 col-sm-6 col-lg-4"
                style={{
                  animation: `slideInUp 0.5s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <ProcessQuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer - Pagination */}
      {totalPages > 1 && (
        <div
          className="card-footer bg-transparent border-0 pt-0"
          style={{
            borderTop: "2px solid var(--border-color)",
            transition: "border-color 0.25s ease",
          }}
        >
          <nav
            aria-label="Page navigation"
            className="d-flex align-items-center justify-content-center"
          >
            <ul className="pagination mb-0 pagination-rounded">
              <li
                className={`page-item ${currentPage === 0 ? "disabled" : ""}`}
                style={{
                  opacity: currentPage === 0 ? 0.5 : 1,
                  transition: "opacity 0.25s ease",
                }}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(0)}
                  aria-label="First page"
                  disabled={currentPage === 0}
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--primary-color)",
                    background: "var(--surface-color)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 0) {
                      e.currentTarget.style.background = "var(--gradient-primary)";
                      e.currentTarget.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-color)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }}
                >
                  <i className="bx bx-chevrons-left" />
                </button>
              </li>

              <li
                className={`page-item ${currentPage === 0 ? "disabled" : ""}`}
                style={{
                  opacity: currentPage === 0 ? 0.5 : 1,
                  transition: "opacity 0.25s ease",
                }}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                  disabled={currentPage === 0}
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--primary-color)",
                    background: "var(--surface-color)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 0) {
                      e.currentTarget.style.background = "var(--gradient-primary)";
                      e.currentTarget.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-color)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }}
                >
                  <i className="bx bx-chevron-left" />
                </button>
              </li>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }).map((_, index) => (
                <li
                  key={index}
                  className={`page-item ${currentPage === index ? "active" : ""}`}
                  style={{
                    transition: "all 0.25s ease",
                  }}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(index)}
                    aria-label={`Page ${index + 1}`}
                    style={{
                      borderColor: currentPage === index ? "var(--primary-color)" : "var(--border-color)",
                      color: currentPage === index ? "white" : "var(--text-color)",
                      background: currentPage === index ? "var(--gradient-primary)" : "var(--surface-color)",
                      fontWeight: currentPage === index ? 600 : 500,
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== index) {
                        e.currentTarget.style.background = "var(--surface-alt)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== index) {
                        e.currentTarget.style.background = "var(--surface-color)";
                      }
                    }}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
                style={{
                  opacity: currentPage === totalPages - 1 ? 0.5 : 1,
                  transition: "opacity 0.25s ease",
                }}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                  disabled={currentPage === totalPages - 1}
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--primary-color)",
                    background: "var(--surface-color)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages - 1) {
                      e.currentTarget.style.background = "var(--gradient-primary)";
                      e.currentTarget.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-color)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }}
                >
                  <i className="bx bx-chevron-right" />
                </button>
              </li>

              <li
                className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
                style={{
                  opacity: currentPage === totalPages - 1 ? 0.5 : 1,
                  transition: "opacity 0.25s ease",
                }}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(totalPages - 1)}
                  aria-label="Last page"
                  disabled={currentPage === totalPages - 1}
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--primary-color)",
                    background: "var(--surface-color)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages - 1) {
                      e.currentTarget.style.background = "var(--gradient-primary)";
                      e.currentTarget.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-color)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }}
                >
                  <i className="bx bx-chevrons-right" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizListSection;