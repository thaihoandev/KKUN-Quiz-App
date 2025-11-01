import {
  POINTS_OPTIONS,
  QUESTION_TYPE_LABELS,
  TIME_LIMIT_OPTIONS,
} from "@/constants/quizConstants";
import { Question } from "@/interfaces";
import { softDeleteQuestion } from "@/services/questionService";
import React from "react";
import { useNavigate } from "react-router-dom";

interface QuestionEditorCardProps {
  quizId: string;
  question: Question;
  index: number;
  onTimeChange: (quizId: string, questionId: string, time: number) => void;
  onPointsChange: (quizId: string, questionId: string, points: number) => void;
}

const QuestionEditorCard: React.FC<QuestionEditorCardProps> = ({
  quizId,
  question,
  index,
  onTimeChange,
  onPointsChange,
}) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/quizzes/${quizId}/questions/${question.questionId}/edit`, {
      state: { quizId, question },
    });
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?");
    if (!confirmed) return;

    try {
      await softDeleteQuestion(quizId, question.questionId);
      alert("Đã xóa câu hỏi thành công.");
      window.location.reload();
    } catch (error) {
      console.error("Lỗi khi xóa câu hỏi:", error);
      alert("Không thể xóa câu hỏi. Vui lòng thử lại.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(question.questionText);
    alert("Đã sao chép nội dung câu hỏi!");
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <button className="btn btn-outline-light btn-sm me-2">
              <i className="bx bx-grid"></i>
            </button>

            <span className="badge bg-primary me-2">
              {index + 1}. {QUESTION_TYPE_LABELS[question.questionType]}
            </span>

            {/* Dropdown chọn thời gian */}
            <div className="dropdown me-2">
              <button
                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                type="button"
                id={`timeDropdown${index}`}
                data-bs-toggle="dropdown"
              >
                <i className="bx bx-stopwatch"></i> {question.timeLimit} giây
              </button>
              <ul
                className="dropdown-menu"
                aria-labelledby={`timeDropdown${index}`}
              >
                {TIME_LIMIT_OPTIONS.map((time) => (
                  <li key={time}>
                    <button
                      className="dropdown-item"
                      onClick={() =>
                        onTimeChange(quizId, question.questionId, time)
                      }
                    >
                      {time} giây
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dropdown chọn điểm */}
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                type="button"
                id={`pointsDropdown${index}`}
                data-bs-toggle="dropdown"
              >
                <i className="bx bx-star"></i> {question.points} điểm
              </button>
              <ul
                className="dropdown-menu"
                aria-labelledby={`pointsDropdown${index}`}
              >
                {POINTS_OPTIONS.map((points) => (
                  <li key={points}>
                    <button
                      className="dropdown-item"
                      onClick={() =>
                        onPointsChange(quizId, question.questionId, points)
                      }
                    >
                      {points} điểm
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ✅ Dropdown menu chức năng */}
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              id={`actionMenu${index}`}
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bx-dots-vertical-rounded fs-5"></i>
            </button>
            <ul
              className="dropdown-menu dropdown-menu-end"
              aria-labelledby={`actionMenu${index}`}
            >
              <li>
                <button className="dropdown-item" onClick={handleCopy}>
                  <i className="bx bx-copy me-2"></i> Sao chép
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleEdit}>
                  <i className="bx bx-edit me-2"></i> Chỉnh sửa
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleDelete}
                >
                  <i className="bx bx-trash me-2"></i> Xóa
                </button>
              </li>
            </ul>
          </div>
        </div>

        <h6 className="mb-3">{question.questionText}</h6>
        <p className="text-muted small mb-3">Lựa chọn trả lời</p>

        <div className="row">
          {question.options.map((option, optIdx) => (
            <div key={optIdx} className="col-6 mb-3">
              <div
                className={`card ${
                  option.correct ? "border-success" : "border-danger"
                } shadow-sm`}
              >
                <div className="card-body p-2 d-flex align-items-center">
                  <i
                    className={`bx ${
                      option.correct ? "bx-check-circle" : "bx-x-circle"
                    } ${option.correct ? "text-success" : "text-danger"} me-2`}
                  ></i>
                  <span>{option.optionText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionEditorCard;
