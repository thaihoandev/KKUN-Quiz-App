import React from "react";

const QuestionEditorSidebar: React.FC = () => {
  const actionItems = [
    { icon: "⚡", text: "Thêm câu hỏi tương tự" },
    { icon: "💬", text: "Thêm lời giải thích" },
    { icon: "🌐", text: "Dịch bài kiểm tra" },
    { icon: "⋮", text: "Lựa chọn khác" },
  ];

  const bulkItems = [
    { icon: "⏱️", text: "Thời gian" },
    { icon: "🏆", text: "Điểm" },
  ];

  const importItems = [
    { icon: "📄", text: "Biểu mẫu Google" },
    { icon: "📊", text: "Bảng tính" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        position: "sticky",
        top: "80px",
      }}
    >
      {/* Actions Card */}
      <div
        style={{
          background: "var(--surface-color)",
          border: "none",
          borderRadius: "var(--border-radius)",
          overflow: "hidden",
          boxShadow: "var(--card-shadow)",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ padding: "1.25rem" }}>
          <h6
            style={{
              margin: "0 0 1rem 0",
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--text-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "18px" }}>⚡</span>
            Hành động
          </h6>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {actionItems.map((item, idx) => (
              <a
                key={idx}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-color)",
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-alt)";
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.color = "var(--primary-color)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text-color)";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.text}
                </span>
                <span style={{ fontSize: "16px" }}>→</span>
              </a>
            ))}
          </div>

          {/* AI Limit */}
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              borderRadius: "8px",
              background: "var(--surface-alt)",
              fontSize: "12px",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>⏱️</span>
            <span>AI limit 0/10 per month</span>
            <span style={{ marginLeft: "auto", cursor: "help" }}>ℹ️</span>
          </div>
        </div>
      </div>

      {/* Bulk Update Card */}
      <div
        style={{
          background: "var(--surface-color)",
          border: "none",
          borderRadius: "var(--border-radius)",
          overflow: "hidden",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div style={{ padding: "1.25rem" }}>
          <h6
            style={{
              margin: "0 0 1rem 0",
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--text-color)",
            }}
          >
            Cập nhật hàng loạt
          </h6>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {bulkItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-alt)";
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.text}
                </span>
                <span style={{ fontSize: "16px", color: "var(--text-light)" }}>
                  ⌄
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Card */}
      <div
        style={{
          background: "var(--surface-color)",
          border: "none",
          borderRadius: "var(--border-radius)",
          overflow: "hidden",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div style={{ padding: "1.25rem" }}>
          <h6
            style={{
              margin: "0 0 1rem 0",
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--text-color)",
            }}
          >
            Nhập từ
          </h6>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {importItems.map((item, idx) => (
              <a
                key={idx}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-color)",
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-alt)";
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.color = "var(--primary-color)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text-color)";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.text}
                </span>
                <span style={{ fontSize: "16px" }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditorSidebar;