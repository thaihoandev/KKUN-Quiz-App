import React, { useState } from "react";
import { UserProfile } from "@/types/users";
import { QuizCreateModal } from "../modals/QuizCreateModal";

interface CreateQuizButtonProps {
  profile: UserProfile | null;
  disabled?: boolean;
}

const CreateQuizButton: React.FC<CreateQuizButtonProps> = ({
  profile,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          borderRadius: "12px",
          fontWeight: 600,
          padding: "0.75rem 1.5rem",
          border: "none",
          background: "var(--gradient-primary)",
          color: "white",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.75rem",
          boxShadow: "var(--card-shadow)",
          transition: "all 0.3s ease",
          fontSize: "1rem",
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.boxShadow = "var(--hover-shadow)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "var(--card-shadow)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        disabled={disabled}
      >
        <span>➕</span>
        <span>Create New Quiz</span>
      </button>

      {open && (
        <QuizCreateModal
          open={open}
          onClose={() => setOpen(false)}
          profile={profile}
        />
      )}
    </>
  );
};

export default CreateQuizButton;