import React from "react";

interface QuestionEditorHeaderProps {
  onBack: () => void;
  onPublish: () => void;
  publishing: boolean;
}

const QuestionEditorHeader: React.FC<QuestionEditorHeaderProps> = ({
  onBack,
  onPublish,
  publishing,
}) => (
  <header
    style={{
      top: 0,
      zIndex: 1000,
      background: "var(--surface-color)",
      borderBottom: "1px solid var(--border-color)",
      boxShadow: "var(--card-shadow)",
      transition: "background-color 0.4s ease, border-color 0.4s ease",
    }}
  >
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      {/* Left: Back Button + Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "0.6rem 0.75rem",
            border: "2px solid var(--border-color)",
            borderRadius: "10px",
            background: "transparent",
            color: "var(--text-color)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.25s ease",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-alt)";
            e.currentTarget.style.borderColor = "var(--primary-color)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border-color)";
          }}
          title="Back"
        >
          ←
        </button>
        <h5
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "var(--text-color)",
          }}
        >
          Nhận biết
        </h5>
      </div>

      {/* Right: Action Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {/* Settings Button */}
        <button
          style={{
            padding: "0.6rem 0.9rem",
            border: "2px solid var(--border-color)",
            borderRadius: "10px",
            background: "transparent",
            color: "var(--text-color)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.25s ease",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-alt)";
            e.currentTarget.style.borderColor = "var(--primary-color)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border-color)";
          }}
          title="Settings"
        >
          <span>⚙️</span>
          <span>Cài đặt</span>
        </button>

        {/* Preview Button */}
        <button
          style={{
            padding: "0.6rem 0.9rem",
            border: "2px solid var(--border-color)",
            borderRadius: "10px",
            background: "transparent",
            color: "var(--text-color)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.25s ease",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-alt)";
            e.currentTarget.style.borderColor = "var(--primary-color)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border-color)";
          }}
          title="Preview"
        >
          <span>👁️</span>
          <span>Xem trước</span>
        </button>

        {/* Publish Button */}
        <button
          onClick={onPublish}
          disabled={publishing}
          style={{
            padding: "0.6rem 0.9rem",
            border: "none",
            borderRadius: "10px",
            background: "var(--gradient-primary)",
            color: "white",
            fontWeight: 600,
            cursor: publishing ? "not-allowed" : "pointer",
            opacity: publishing ? 0.6 : 1,
            transition: "all 0.25s ease",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
          onMouseEnter={(e) => {
            if (!publishing) {
              e.currentTarget.style.boxShadow = "var(--hover-shadow)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          title="Publish"
        >
          {publishing ? (
            <>
              <div
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span>Đang xuất bản</span>
            </>
          ) : (
            <>
              <span>⬆️</span>
              <span>Xuất bản</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  </header>
);

export default QuestionEditorHeader;