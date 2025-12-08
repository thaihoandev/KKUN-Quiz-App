import React from "react";
import type { OptionDTO } from "@/types/game";
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
  disabled: boolean;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  isSelected,
  onClick,
  disabled,
}) => {
  const getDisplayContent = () => {
    if (isSingleChoice(option)) {
      if (option.imageUrl || option.thumbnailUrl) {
        return (
          <div className="text-center">
            <img
              src={option.imageUrl || option.thumbnailUrl}
              alt={option.text || "Option"}
              className="img-fluid rounded mb-2"
              style={{ maxHeight: "150px" }}
            />
            {option.text && <div>{option.text}</div>}
          </div>
        );
      }
      return option.text || "Option";
    }

    if (isMatching(option)) {
      return `${option.leftItem} → ${option.rightItem}`;
    }

    if (isOrdering(option)) {
      return option.item;
    }

    if (isDragDrop(option)) {
      return option.draggableItem;
    }

    return "Option";
  };

  return (
    <button
      className={`btn w-100 py-4 rounded-4 fs-4 fw-bold ${
        isSelected ? "btn-primary text-white" : "btn-outline-primary"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {getDisplayContent()}
    </button>
  );
};