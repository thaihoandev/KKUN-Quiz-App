import { useEffect, useState } from "react";
import { getQuizzesByUser } from "@/services/quizService";
import QuizSubCard from "@/components/cards/QuizSubCard";
import CreateQuizButtonWithModal from "@/components/buttons/CreateQuizButtonWithModal";
import { Quiz, UserResponseDTO } from "@/interfaces";

interface PaginationState {
  currentPage: number;
  totalPages: number;
}

interface QuizzesTabProps {
  profile: UserResponseDTO | null;
}

const QuizzesTab = ({ profile }: QuizzesTabProps) => {
  const [quizzes, setQuizzes] = useState<{
    PUBLISHED: Quiz[];
    DRAFT: Quiz[];
    CLOSED: Quiz[];
  }>({
    PUBLISHED: [],
    DRAFT: [],
    CLOSED: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    PUBLISHED: PaginationState;
    DRAFT: PaginationState;
    CLOSED: PaginationState;
  }>({
    PUBLISHED: { currentPage: 0, totalPages: 0 },
    DRAFT: { currentPage: 0, totalPages: 0 },
    CLOSED: { currentPage: 0, totalPages: 0 },
  });
  const [pageSize] = useState<number>(10);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.userId) return;

      try {
        setLoading(true);
        const statuses: ("PUBLISHED" | "DRAFT" | "CLOSED")[] = ["PUBLISHED", "DRAFT", "CLOSED"];
        const fetchPromises = statuses.map(async (status) => {
          const quizzesData = await getQuizzesByUser(
            profile.userId,
            pagination[status].currentPage,
            pageSize,
            status
          );
          return { status, data: quizzesData };
        });

        const results = await Promise.all(fetchPromises);
        const updatedQuizzes = { ...quizzes };
        const updatedPagination = { ...pagination };

        results.forEach(({ status, data }) => {
          updatedQuizzes[status] = data.content || [];
          updatedPagination[status] = {
            ...updatedPagination[status],
            totalPages: data.totalPages || 0,
          };
        });

        setQuizzes(updatedQuizzes);
        setPagination(updatedPagination);
      } catch (err: any) {
        setError("Failed to load quizzes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    profile?.userId,
    pagination.PUBLISHED.currentPage,
    pagination.DRAFT.currentPage,
    pagination.CLOSED.currentPage,
    pageSize,
  ]);

  const handlePageChange = (status: "PUBLISHED" | "DRAFT" | "CLOSED", newPage: number) => {
    if (newPage >= 0 && newPage < pagination[status].totalPages) {
      setPagination((prev) => ({
        ...prev,
        [status]: { ...prev[status], currentPage: newPage },
      }));
    }
  };

  const getPageNumbers = (totalPages: number, currentPage: number) => {
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];
    const startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (startPage > 0) {
      pages.push(0);
      if (startPage > 1) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) pages.push("...");
      pages.push(totalPages - 1);
    }

    return pages;
  };

  return (
    <div className="row">
      <div className="col-xl-12 d-flex justify-content-end">
        <CreateQuizButtonWithModal profile={profile} disabled={loading} />
      </div>
      <div className="col-xl-12">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading quizzes...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <>
            <div className="nav-align-top nav-tabs-shadow">
              <ul className="nav nav-tabs justify-content-center" role="tablist">
                {[
                  { id: "published", label: "Published", icon: "bx bx-home", count: quizzes.PUBLISHED.length },
                  { id: "draft", label: "Draft", icon: "bx bx-user", count: quizzes.DRAFT.length },
                  { id: "archived", label: "Archived", icon: "bx bx-archive", count: quizzes.CLOSED.length },
                ].map((tab, index) => (
                  <li className="nav-item flex-fill text-center" key={tab.id}>
                    <button
                      type="button"
                      className={`nav-link mx-0 w-100 ${index === 0 ? "active" : ""}`}
                      role="tab"
                      data-bs-toggle="tab"
                      data-bs-target={`#navs-justified-${tab.id}`}
                      aria-controls={`navs-justified-${tab.id}`}
                      aria-selected={index === 0}
                    >
                      <i className={`icon-base ${tab.icon} icon-sm me-2`}></i>
                      <span className="fw-semibold">{tab.label}</span>
                      <span className="badge rounded-pill bg-primary ms-2">{tab.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="tab-content">
                <div className="tab-pane fade show active" id="navs-justified-published" role="tabpanel">
                  {quizzes.PUBLISHED.length > 0 ? (
                    quizzes.PUBLISHED.map((quiz) => (
                      <QuizSubCard key={quiz.quizId} quiz={quiz} />
                    ))
                  ) : (
                    <p className="text-center">No published quizzes found.</p>
                  )}
                  {pagination.PUBLISHED.totalPages > 1 && (
                    <nav aria-label="Published quizzes pagination" className="mt-4">
                      <ul className="pagination justify-content-center">
                        <li
                          className={`page-item ${
                            pagination.PUBLISHED.currentPage === 0 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange("PUBLISHED", pagination.PUBLISHED.currentPage - 1)}
                            disabled={pagination.PUBLISHED.currentPage === 0}
                            aria-label="Previous page"
                          >
                            Previous
                          </button>
                        </li>
                        {getPageNumbers(pagination.PUBLISHED.totalPages, pagination.PUBLISHED.currentPage).map(
                          (page, index) =>
                            typeof page === "number" ? (
                              <li
                                key={index}
                                className={`page-item ${
                                  pagination.PUBLISHED.currentPage === page ? "active" : ""
                                }`}
                                aria-current={pagination.PUBLISHED.currentPage === page ? "page" : undefined}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange("PUBLISHED", page)}
                                  aria-label={`Page ${page + 1}`}
                                >
                                  {page + 1}
                                </button>
                              </li>
                            ) : (
                              <li key={index} className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            )
                        )}
                        <li
                          className={`page-item ${
                            pagination.PUBLISHED.currentPage === pagination.PUBLISHED.totalPages - 1
                              ? "disabled"
                              : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange("PUBLISHED", pagination.PUBLISHED.currentPage + 1)}
                            disabled={pagination.PUBLISHED.currentPage === pagination.PUBLISHED.totalPages - 1}
                            aria-label="Next page"
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
                <div className="tab-pane fade" id="navs-justified-draft" role="tabpanel">
                  {quizzes.DRAFT.length > 0 ? (
                    quizzes.DRAFT.map((quiz) => (
                      <QuizSubCard key={quiz.quizId} quiz={quiz} />
                    ))
                  ) : (
                    <p className="text-center">No draft quizzes found.</p>
                  )}
                  {pagination.DRAFT.totalPages > 1 && (
                    <nav aria-label="Draft quizzes pagination" className="mt-4">
                      <ul className="pagination justify-content-center">
                        <li
                          className={`page-item ${pagination.DRAFT.currentPage === 0 ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange("DRAFT", pagination.DRAFT.currentPage - 1)}
                            disabled={pagination.DRAFT.currentPage === 0}
                            aria-label="Previous page"
                          >
                            Previous
                          </button>
                        </li>
                        {getPageNumbers(pagination.DRAFT.totalPages, pagination.DRAFT.currentPage).map(
                          (page, index) =>
                            typeof page === "number" ? (
                              <li
                                key={index}
                                className={`page-item ${
                                  pagination.DRAFT.currentPage === page ? "active" : ""
                                }`}
                                aria-current={pagination.DRAFT.currentPage === page ? "page" : undefined}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange("DRAFT", page)}
                                  aria-label={`Page ${page + 1}`}
                                >
                                  {page + 1}
                                </button>
                              </li>
                            ) : (
                              <li key={index} className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            )
                        )}
                        <li
                        className={`page-item ${pagination.DRAFT.currentPage === pagination.DRAFT.totalPages - 1 ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange("DRAFT", pagination.DRAFT.currentPage + 1)}
                            disabled={pagination.DRAFT.currentPage === pagination.DRAFT.totalPages - 1}
                            aria-label="Next page"
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
                <div className="tab-pane fade" id="navs-justified-archived" role="tabpanel">
                  {quizzes.CLOSED.length > 0 ? (
                    quizzes.CLOSED.map((quiz) => (
                      <QuizSubCard key={quiz.quizId} quiz={quiz} />
                    ))
                  ) : (
                    <p className="text-center">No archived quizzes found.</p>
                  )}
                  {pagination.CLOSED.totalPages > 1 && (
                    <nav aria-label="Archived quizzes pagination" className="mt-4">
                      <ul className="pagination justify-content-center">
                        <li
                          className={`page-item ${pagination.CLOSED.currentPage === 0 ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange("CLOSED", pagination.CLOSED.currentPage - 1)}
                            disabled={pagination.CLOSED.currentPage === 0}
                            aria-label="Previous page"
                          >
                            Previous
                          </button>
                        </li>
                        {getPageNumbers(pagination.CLOSED.totalPages, pagination.CLOSED.currentPage).map(
                          (page, index) =>
                            typeof page === "number" ? (
                              <li
                                key={index}
                                className={`page-item ${
                                  pagination.CLOSED.currentPage === page ? "active" : ""
                                }`}
                                aria-current={pagination.CLOSED.currentPage === page ? "page" : undefined}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange("CLOSED", page)}
                                  aria-label={`Page ${page + 1}`}
                                >
                                  {page + 1}
                                </button>
                              </li>
                            ) : (
                              <li key={index} className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            )
                        )}
                        <li
                          className={`page-item ${
                            pagination.CLOSED.currentPage === pagination.CLOSED.totalPages - 1
                              ? "disabled"
                              : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange("CLOSED", pagination.CLOSED.currentPage + 1)}
                            disabled={pagination.CLOSED.currentPage === pagination.CLOSED.totalPages - 1}
                            aria-label="Next page"
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizzesTab;