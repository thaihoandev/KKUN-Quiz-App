import { useState, useEffect } from "react";
import { PageResponse } from "@/interfaces";
import { getPublishedQuizzes, QuizSummaryDto } from "@/services/quizService";
import ProcessQuizCard from "../cards/ProcessQuizCard";

interface QuizListSectionProps {
  initialPage?: number;
  pageSize?: number;
}

const QuizListSection = ({
  initialPage = 0,
  pageSize = 6,
}: QuizListSectionProps) => {
  const [quizzes, setQuizzes] = useState<QuizSummaryDto[]>([]);
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

  // Fetch quizzes - dùng đúng signature mới của getPublishedQuizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        // Ưu tiên sort theo recommendationScore nếu có, fallback về startCount hoặc createdAt
        const response: PageResponse<QuizSummaryDto> = await getPublishedQuizzes(
          undefined,        // keyword
          currentPage,
          pageSize,
          "createdAt",  // sortBy
          "DESC"                    // sortDirection
        );

        // Nếu backend không hỗ trợ recommendationScore (trả về lỗi hoặc rỗng), fallback
        if (!response || response.content.length === 0 && currentPage === 0) {
          const fallback = await getPublishedQuizzes(
            undefined,
            currentPage,
            pageSize,
            "startCount",
            "DESC"
          );
          setQuizzes(fallback.content);
          setTotalPages(fallback.totalPages);
        } else {
          setQuizzes(response.content);
          setTotalPages(response.totalPages);
        }
      } catch (e: any) {
        console.error("Failed to fetch quizzes:", e);

        // Fallback khi recommendationScore chưa được hỗ trợ
        if (e?.response?.status === 400 || e?.message?.includes("sort")) {
          try {
            const fallback = await getPublishedQuizzes(
              undefined,
              currentPage,
              pageSize,
              "startCount",
              "DESC"
            );
            setQuizzes(fallback.content);
            setTotalPages(fallback.totalPages);
          } catch (fallbackError) {
            setQuizzes([]);
            setTotalPages(0);
          }
        } else {
          setQuizzes([]);
          setTotalPages(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            Recommended Quizzes
          </h4>
          <small
            style={{
              color: "var(--text-muted)",
              transition: "color 0.25s ease",
            }}
          >
            {loading ? "Loading…" : `Showing ${quizzes.length} quiz(s)`}
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
            >
              <i className="bx bx-chevrons-left" />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous page"
            >
              <i className="bx bx-chevron-left" />
            </button>

            <span className="small text-muted">
              Page <strong className="text-primary">{currentPage + 1}</strong> of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next page"
            >
              <i className="bx bx-chevron-right" />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(totalPages - 1)}
              aria-label="Last page"
            >
              <i className="bx bx-chevrons-right" />
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body pt-4">
        {loading ? (
          <div className="row gy-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-4">
                <div
                  className="card rounded-3 border-0 shadow-sm h-100 placeholder-glow"
                  style={{ background: "var(--surface-alt)" }}
                >
                  <div className="card-body">
                    <div className="placeholder col-8 mb-3 h-20px" />
                    <div className="placeholder col-10 mb-2 h-16px" />
                    <div className="placeholder col-7 mb-4 h-16px" />
                    <div className="d-flex gap-2">
                      <div className="placeholder col-4 h-32px rounded" />
                      <div className="placeholder col-5 h-32px rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bx bx-notepad" style={{ fontSize: "4rem", opacity: 0.5 }} />
            <p className="mt-3 mb-0">No recommended quizzes available at the moment.</p>
          </div>
        ) : (
          <div className="row g-4">
            {quizzes.map((quiz, index) => (
              <div
                key={quiz.quizId}
                className="col-12 col-sm-6 col-lg-4"
                style={{
                  animation: `slideInUp 0.6s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <ProcessQuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Pagination - chỉ hiện khi có nhiều trang */}
      {totalPages > 1 && !loading && (
        <div
          className="card-footer bg-transparent border-0 pt-0"
          style={{ borderTop: "2px solid var(--border-color)" }}
        >
          <nav aria-label="Quiz pagination" className="d-flex justify-content-center">
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(0)} disabled={currentPage === 0}>
                  <i className="bx bx-chevrons-left" />
                </button>
              </li>
              <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                  <i className="bx bx-chevron-left" />
                </button>
              </li>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i;
                } else if (currentPage < 4) {
                  pageNum = i;
                } else if (currentPage > totalPages - 5) {
                  pageNum = totalPages - 7 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <li
                    key={pageNum}
                    className={`page-item ${currentPage === pageNum ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        background: currentPage === pageNum ? "var(--gradient-primary)" : "var(--surface-color)",
                        color: currentPage === pageNum ? "white" : "var(--text-color)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      {pageNum + 1}
                    </button>
                  </li>
                );
              }).filter(Boolean)}

              <li className={`page-item ${currentPage >= totalPages - 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  <i className="bx bx-chevron-right" />
                </button>
              </li>
              <li className={`page-item ${currentPage >= totalPages - 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  <i className="bx bx-chevrons-right" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

    </div>
  );
};

export default QuizListSection;