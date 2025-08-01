import React, { useState } from "react";
import QuizCreateModal from "@/components/modals/QuizCreateModal";
import { UserProfile } from "@/interfaces";

interface CreateQuizButtonWithModalProps {
  profile: UserProfile | null;
  disabled?: boolean;
}

const CreateQuizButtonWithModal: React.FC<CreateQuizButtonWithModalProps> = ({
  profile,
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-primary mb-5"
        disabled={disabled}
      >
        <i className="icon-base bx bx-edit icon-sm me-2"></i>
        Create new quiz
      </button>
      <QuizCreateModal
        show={showModal}
        onClose={() => setShowModal(false)}
        profile={profile}
        loading={disabled}
      />
    </>
  );
};

export default CreateQuizButtonWithModal;