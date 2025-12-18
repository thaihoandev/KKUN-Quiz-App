import React from "react";
import type { OptionDTO, SingleChoiceOption } from "@/types/game";
import {
  isSingleChoice,
  isMatching,
  isOrdering,
  isDragDrop,
} from "@/types/game";

interface OptionButtonProps {
  option: OptionDTO;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  showCorrect?: boolean; // ← THÊM PROP NÀY → Fix lỗi TS
  size?: "sm" | "md" | "lg"; // tùy chọn kích thước
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  isSelected,
  onClick,
  disabled = false,
  showCorrect = false,
  size = "lg",
}) => {
  // Xác định đáp án đúng/sai (chỉ có khi backend gửi correct: true/false)
  const isCorrectAnswer = option.correct === true;
  const isWrongAnswer = option.correct === false;

  const getDisplayContent = () => {
    if (isSingleChoice(option)) {
      const opt = option as SingleChoiceOption;

      // Ưu tiên ảnh lớn nếu có
      if (opt.imageUrl || opt.thumbnailUrl) {
        return (
          <div className="text-center">
            <img
              src={opt.imageUrl || opt.thumbnailUrl!}
              alt={opt.text || "Option"}
              className="img-fluid rounded-3 mb-3 shadow-sm"
              style={{
                maxHeight: size === "lg" ? "180px" : "140px",
                objectFit: "cover",
              }}
            />
            {opt.text && <div className="fw-bold fs-5">{opt.text}</div>}
            {opt.imageLabel && <small className="text-muted">{opt.imageLabel}</small>}
          </div>
        );
      }
      return <span className="fw-bold">{opt.text || "Option"}</span>;
    }

    if (isMatching(option)) {
      return (
        <div>
          <div className="fw-bold">{option.leftItem}</div>
          <small className="text-muted">→ {option.rightItem}</small>
        </div>
      );
    }

    if (isOrdering(option)) {
      return <span className="fw-bold">{option.item}</span>;
    }

    if (isDragDrop(option)) {
      return (
        <div className="d-flex align-items-center gap-3">
          {option.dragImageUrl && (
            <img
              src={option.dragImageUrl}
              alt="drag"
              className="rounded"
              style={{ width: 50, height: 50, objectFit: "cover" }}
            />
          )}
          <span className="fw-bold">{option.draggableItem}</span>
        </div>
      );
    }

    return "Option";
  };

  // Xác định class theo trạng thái
  const baseClasses = "btn w-100 position-relative overflow-hidden transition-all";
  const sizeClasses = size === "lg" ? "py-5 px-4 fs-3" : size === "md" ? "py-4 px-3 fs-4" : "py-3 px-3";

  let stateClasses = "";

  if (disabled) {
    stateClasses = "opacity-60 cursor-not-allowed";
  } else if (showCorrect) {
    if (isCorrectAnswer) {
      stateClasses = "btn-success text-white border-4 border-success shadow-lg";
    } else if (isWrongAnswer && isSelected) {
      stateClasses = "btn-danger text-white border-4 border-danger shadow-lg";
    } else {
      stateClasses = "btn-outline-secondary text-muted";
    }
  } else {
    stateClasses = isSelected
      ? "btn-primary text-white shadow-lg"
      : "btn-outline-primary hover-shadow";
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${stateClasses} rounded-4`}
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: size === "lg" ? "140px" : "110px",
        background: showCorrect && isCorrectAnswer ? "linear-gradient(135deg, #56ab2f, #a8e6cf)" : undefined,
      }}
    >
      <div className="d-flex align-items-center justify-content-center h-100">
        {getDisplayContent()}
      </div>

      {/* Icon góc phải trên */}
      {(isSelected || showCorrect) && (
        <div className="position-absolute top-0 end-0 m-3">
          {showCorrect && isCorrectAnswer && (
            <i className="bx bxs-check-circle fs-1 text-white drop-shadow"></i>
          )}
          {showCorrect && isWrongAnswer && isSelected && (
            <i className="bx bxs-x-circle fs-1 text-white drop-shadow"></i>
          )}
          {!showCorrect && isSelected && (
            <i className="bx bx-check fs-1 text-white"></i>
          )}
        </div>
      )}
    </button>
  );
};