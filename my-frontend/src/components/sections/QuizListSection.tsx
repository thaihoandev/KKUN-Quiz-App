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
    <div className="card mb-6 border-0 shadow-sm rounded-4">
      <div className="card-header d-flex flex-wrap justify-content-between align-items-end gap-3 border-0 bg-transparent">
        <div>
          <h4 className="mb-1 fw-bold">Recommended Quizzes</h4>
          <small className="text-muted">
            {loading ? "Loading…" : `Showing ${quizzes.length} item(s)`}
          </small>
        </div>

        {totalPages > 1 && (
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(0)}
              aria-label="First page"
              title="First page"
            >
              <i className="icon-base bx bx-chevrons-left icon-sm" />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous page"
              title="Previous page"
            >
              <i className="icon-base bx bx-chevron-left icon-sm" />
            </button>

            <span className="small text-muted">
              Page <strong>{currentPage + 1}</strong> / {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next page"
              title="Next page"
            >
              <i className="icon-base bx bx-chevron-right icon-sm" />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(totalPages - 1)}
              aria-label="Last page"
              title="Last page"
            >
              <i className="icon-base bx bx-chevrons-right icon-sm" />
            </button>
          </div>
        )}
      </div>

      <div className="card-body pt-2">
        {loading ? (
          <div className="row gy-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-4">
                <div className="card rounded-3 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="placeholder-glow">
                      <div className="placeholder col-8 mb-2" />
                      <div className="placeholder col-6 mb-2" />
                      <div className="placeholder col-10 mb-2" />
                      <div className="placeholder col-7 mb-2" />
                      <div className="d-flex gap-2 mt-3">
                        <span className="placeholder col-3" />
                        <span className="placeholder col-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bx bx-notepad display-6 d-block mb-2" />
            No quizzes available right now.
          </div>
        ) : (
          <div className="row gy-4">
            {quizzes.map((quiz) => (
                <ProcessQuizCard quiz={quiz} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="card-footer bg-transparent border-0 pt-0">
          <nav
            aria-label="Page navigation"
            className="d-flex align-items-center justify-content-center"
          >
            <ul className="pagination mb-0 pagination-rounded">
              <li className={`page-item first ${currentPage === 0 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(0)}
                  aria-label="First page"
                >
                  <i className="icon-base bx bx-chevrons-left icon-sm" />
                </button>
              </li>
              <li className={`page-item prev ${currentPage === 0 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <i className="icon-base bx bx-chevron-left icon-sm" />
                </button>
              </li>

              {Array.from({ length: totalPages }).map((_, index) => (
                <li
                  key={index}
                  className={`page-item ${currentPage === index ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(index)}
                    aria-label={`Page ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}

              <li
                className={`page-item next ${
                  currentPage === totalPages - 1 ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                >
                  <i className="icon-base bx bx-chevron-right icon-sm" />
                </button>
              </li>
              <li
                className={`page-item last ${
                  currentPage === totalPages - 1 ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(totalPages - 1)}
                  aria-label="Last page"
                >
                  <i className="icon-base bx bx-chevrons-right icon-sm" />
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
