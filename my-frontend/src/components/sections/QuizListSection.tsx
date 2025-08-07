import { useState, useEffect } from "react";
import { Quiz } from "@/interfaces";
import { getPublishedQuizzes } from "@/services/quizService";
import ProcessQuizCard from "../cards/ProcessQuizCard";

interface QuizListSectionProps {
  initialPage?: number;
  pageSize?: number;
}

const QuizListSection = ({ initialPage = 0, pageSize = 6 }: QuizListSectionProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [category, setCategory] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const response = await getPublishedQuizzes(currentPage, pageSize, "recommendationScore,desc");
      if (response) {
        setQuizzes(response.content);
        setTotalPages(response.totalPages);
      }
    };
    fetchQuizzes();
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      (!category || quiz.category === category) &&
      (!hideCompleted || quiz.status !== "CLOSED")
  );

  return (
    <div className="card mb-6">
      <div className="card-header d-flex flex-wrap justify-content-between gap-4">
        <div className="card-title mb-0 me-1">
          <h5 className="mb-0">Recommended Quizzes</h5>
          <p className="mb-0">Total {filteredQuizzes.length} quizzes available</p>
        </div>
        <div className="d-flex justify-content-md-end align-items-sm-center align-items-start column-gap-6 flex-sm-row flex-column row-gap-4">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Web">Web</option>
            <option value="UI/UX">UI/UX</option>
            <option value="SEO">SEO</option>
            <option value="Music">Music</option>
            <option value="Painting">Painting</option>
          </select>
          <div className="form-check form-switch my-2 ms-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="QuizSwitch"
              checked={hideCompleted}
              onChange={() => setHideCompleted(!hideCompleted)}
            />
            <label className="form-check-label text-nowrap mb-0" htmlFor="QuizSwitch">
              Hide completed
            </label>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="row gy-6 mb-6">
          {filteredQuizzes.map((quiz) => (
            <ProcessQuizCard key={quiz.quizId} quiz={quiz} />
          ))}
        </div>
        <nav aria-label="Page navigation" className="d-flex align-items-center justify-content-center">
          <ul className="pagination mb-0 pagination-rounded">
            <li className={`page-item first ${currentPage === 0 ? "disabled" : ""}`}>
              <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(0)}>
                <i className="icon-base bx bx-chevrons-left icon-sm scaleX-n1-rtl"></i>
              </a>
            </li>
            <li className={`page-item prev ${currentPage === 0 ? "disabled" : ""}`}>
              <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(currentPage - 1)}>
                <i className="icon-base bx bx-chevron-left icon-sm scaleX-n1-rtl"></i>
              </a>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li key={index} className={`page-item ${currentPage === index ? "active" : ""}`}>
                <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(index)}>
                  {index + 1}
                </a>
              </li>
            ))}
            <li className={`page-item next ${currentPage === totalPages - 1 ? "disabled" : ""}`}>
              <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(currentPage + 1)}>
                <i className="icon-base bx bx-chevron-right icon-sm scaleX-n1-rtl"></i>
              </a>
            </li>
            <li className={`page-item last ${currentPage === totalPages - 1 ? "disabled" : ""}`}>
              <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(totalPages - 1)}>
                <i className="icon-base bx bx-chevrons-right icon-sm scaleX-n1-rtl"></i>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default QuizListSection;