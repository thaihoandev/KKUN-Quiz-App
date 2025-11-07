import { useEffect, useState } from "react";
import { getQuizzesByUser } from "@/services/quizService";
import QuizSubCard from "@/components/cards/QuizSubCard";
import CreateQuizButtonWithModal from "@/components/buttons/CreateQuizButtonWithModal";
import { Quiz } from "@/interfaces";
import { User } from "@/types/users";

interface PaginationState {
  currentPage: number;
  totalPages: number;
}

interface QuizzesTabProps {
  profile: User | null;
}

const TABS = [
  { id: "published", label: "Published", icon: "bx bx-bulb", status: "PUBLISHED" },
  { id: "draft", label: "Drafts", icon: "bx bx-edit-alt", status: "DRAFT" },
  { id: "archived", label: "Archived", icon: "bx bx-archive", status: "CLOSED" },
] as const;

const QuizzesTab = ({ profile }: QuizzesTabProps) => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["status"]>("PUBLISHED");
  const [quizzes, setQuizzes] = useState<Record<string, Quiz[]>>({
    PUBLISHED: [],
    DRAFT: [],
    CLOSED: [],
  });
  const [pagination, setPagination] = useState<Record<string, PaginationState>>({
    PUBLISHED: { currentPage: 0, totalPages: 0 },
    DRAFT: { currentPage: 0, totalPages: 0 },
    CLOSED: { currentPage: 0, totalPages: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  // === Fetch data ===
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.userId) return;
      try {
        setLoading(true);
        setError(null);
        const statuses: ("PUBLISHED" | "DRAFT" | "CLOSED")[] = ["PUBLISHED", "DRAFT", "CLOSED"];
        const result = await Promise.all(
          statuses.map(async (status) => {
            const data = await getQuizzesByUser(profile.userId, pagination[status].currentPage, pageSize, status);
            return { status, data };
          })
        );

        const newQuizzes = { ...quizzes };
        const newPagination = { ...pagination };
        result.forEach(({ status, data }) => {
          newQuizzes[status] = data.content || [];
          newPagination[status].totalPages = data.totalPages || 0;
        });
        setQuizzes(newQuizzes);
        setPagination(newPagination);
      } catch (err) {
        console.error(err);
        setError("Failed to load quizzes.");
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
  ]);

  // === Pagination handler ===
  const handlePageChange = (status: string, newPage: number) => {
    if (newPage >= 0 && newPage < pagination[status].totalPages) {
      setPagination((prev) => ({
        ...prev,
        [status]: { ...prev[status], currentPage: newPage },
      }));
    }
  };

  // === Page number builder ===
  const getPageNumbers = (totalPages: number, currentPage: number) => {
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];
    const startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);
    if (startPage > 0) {
      pages.push(0);
      if (startPage > 1) pages.push("...");
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  // === Render pagination component ===
  const renderPagination = (status: string) => {
    const state = pagination[status];
    if (state.totalPages <= 1) return null;

    return (
      <nav aria-label={`${status} pagination`} className="mt-4 animate-slide-in">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${state.currentPage === 0 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(status, state.currentPage - 1)}
              disabled={state.currentPage === 0}
            >
              ← Previous
            </button>
          </li>
          {getPageNumbers(state.totalPages, state.currentPage).map((p, i) =>
            typeof p === "number" ? (
              <li
                key={i}
                className={`page-item ${state.currentPage === p ? "active" : ""}`}
                aria-current={state.currentPage === p ? "page" : undefined}
              >
                <button className="page-link" onClick={() => handlePageChange(status, p)}>
                  {p + 1}
                </button>
              </li>
            ) : (
              <li key={i} className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )
          )}
          <li className={`page-item ${state.currentPage === state.totalPages - 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(status, state.currentPage + 1)}
              disabled={state.currentPage === state.totalPages - 1}
            >
              Next →
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="container-fluid py-4 quizzes-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-gradient">
          <i className="bx bx-brain me-2"></i> My Quiz Collection
        </h2>
        <CreateQuizButtonWithModal profile={profile} disabled={loading} />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary animate-pulse" role="status"></div>
          <p className="mt-3 text-muted">Loading quizzes...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger shadow-quiz animate-slide-in">{error}</div>
      ) : (
        <div className="animate-slide-in">
          {/* === Tabs Header === */}
          <ul className="nav nav-tabs justify-content-center mb-3 nav-tabs-shadow">
            {TABS.map((tab) => (
              <li key={tab.id} className="nav-item m-0 flex-fill text-center">
                <button
                  className={`nav-link w-100 m-0 ${activeTab === tab.status ? "active gradient-primary text-white" : ""}`}
                  onClick={() => setActiveTab(tab.status)}
                >
                  <i className={`${tab.icon} me-2`}></i>
                  {tab.label}
                  <span className="badge bg-primary mx-2">
                    {quizzes[tab.status].length}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* === Tab Content === */}
          <div className="tab-content p-3 rounded-lg shadow-quiz bg-surface animate-slide-in">
            {TABS.map((tab) => (
              <div
                key={tab.id}
                className={`tab-pane fade ${activeTab === tab.status ? "show active" : ""}`}
              >
                {quizzes[tab.status].length > 0 ? (
                  quizzes[tab.status].map((quiz) => (
                    <QuizSubCard key={quiz.quizId} quiz={quiz} />
                  ))
                ) : (
                  <p className="text-center  py-4">
                    No {tab.label.toLowerCase()} quizzes found.
                  </p>
                )}
                {renderPagination(tab.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesTab;
