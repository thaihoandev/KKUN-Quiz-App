// ==================== COMPLETE OPTIONS RENDERER - FIXED ====================
// ✅ All 14 question types with TRUE_FALSE fix

import React from "react";
import type { QuestionResponseDTO } from "@/types/game";

interface OptionsRendererProps {
  question: QuestionResponseDTO;
  selectedAnswer: any;
  onSelectAnswer: (answer: any) => void;
}

const OptionsRenderer: React.FC<OptionsRendererProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
}) => {
  if (!question.options || question.options.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Không có tùy chọn</p>;
  }

  const questionType = question.type;
  
  // ==================== SINGLE CHOICE ====================
  if (questionType === "SINGLE_CHOICE") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {question.options.map((option: any) => (
          <label
            key={option.optionId}
            style={{
              padding: "1rem",
              backgroundColor:
                selectedAnswer === option.optionId
                  ? "var(--primary-color)"
                  : "var(--surface-alt)",
              color:
                selectedAnswer === option.optionId
                  ? "#fff"
                  : "var(--text-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="radio"
              name="answer"
              value={option.optionId}
              checked={selectedAnswer === option.optionId}
              onChange={() => onSelectAnswer(option.optionId)}
              style={{ cursor: "pointer" }}
            />
            <span>{option.text || "Tùy chọn"}</span>
          </label>
        ))}
      </div>
    );
  }

  // ==================== MULTIPLE CHOICE ====================
  if (questionType === "MULTIPLE_CHOICE") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {question.options.map((option: any) => (
          <label
            key={option.optionId}
            style={{
              padding: "1rem",
              backgroundColor: (selectedAnswer || []).includes(option.optionId)
                ? "var(--primary-color)"
                : "var(--surface-alt)",
              color: (selectedAnswer || []).includes(option.optionId)
                ? "#fff"
                : "var(--text-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="checkbox"
              checked={(selectedAnswer || []).includes(option.optionId)}
              onChange={(e) => {
                if (e.target.checked) {
                  onSelectAnswer([
                    ...(selectedAnswer || []),
                    option.optionId,
                  ]);
                } else {
                  onSelectAnswer(
                    (selectedAnswer || []).filter(
                      (id: string) => id !== option.optionId
                    )
                  );
                }
              }}
              style={{ cursor: "pointer" }}
            />
            <span>{option.text || "Tùy chọn"}</span>
          </label>
        ))}
      </div>
    );
  }

  // ==================== TRUE/FALSE ====================
  // ✅ FIXED: Use string values "true"/"false" instead of booleans
  if (questionType === "TRUE_FALSE") {
    return (
      <div style={{ display: "flex", gap: "1rem" }}>
        {[
          { id: "true", label: "✓ Đúng", value: "true" },
          { id: "false", label: "✗ Sai", value: "false" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => onSelectAnswer(btn.value)}
            style={{
              flex: 1,
              padding: "1.5rem",
              backgroundColor:
                selectedAnswer === btn.value || 
                String(selectedAnswer) === btn.value ||
                (btn.value === "true" && selectedAnswer === true) ||
                (btn.value === "false" && selectedAnswer === false)
                  ? "var(--primary-color)"
                  : "var(--surface-alt)",
              color:
                selectedAnswer === btn.value || 
                String(selectedAnswer) === btn.value ||
                (btn.value === "true" && selectedAnswer === true) ||
                (btn.value === "false" && selectedAnswer === false)
                  ? "#fff"
                  : "var(--text-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    );
  }

  // ==================== IMAGE SELECTION ====================
  if (questionType === "IMAGE_SELECTION") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
        }}
      >
        {question.options.map((option: any) => (
          <div
            key={option.optionId}
            onClick={() => onSelectAnswer(option.optionId)}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "8px",
              overflow: "hidden",
              border:
                selectedAnswer === option.optionId
                  ? "3px solid var(--primary-color)"
                  : "2px solid var(--border-color)",
              transition: "all 0.2s ease",
              opacity: selectedAnswer === option.optionId ? 1 : 0.7,
            }}
          >
            <img
              src={option.imageUrl || option.thumbnailUrl}
              alt={option.imageLabel}
              style={{
                width: "100%",
                height: "120px",
                objectFit: "cover",
                display: "block",
              }}
            />
            {option.imageLabel && (
              <div
                style={{
                  padding: "0.5rem",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  textAlign: "center",
                }}
              >
                {option.imageLabel}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ==================== FILL IN THE BLANK ====================
  if (questionType === "FILL_IN_THE_BLANK") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Nhập câu trả lời của bạn..."
          value={selectedAnswer || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid var(--border-color)",
            borderRadius: "8px",
            backgroundColor: "var(--surface-alt)",
            color: "var(--text-color)",
          }}
        />
        {selectedAnswer && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Câu trả lời: <strong>{selectedAnswer}</strong>
          </p>
        )}
      </div>
    );
  }

  // ==================== SHORT ANSWER ====================
  if (questionType === "SHORT_ANSWER") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <textarea
          placeholder="Nhập câu trả lời ngắn của bạn..."
          value={selectedAnswer || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid var(--border-color)",
            borderRadius: "8px",
            backgroundColor: "var(--surface-alt)",
            color: "var(--text-color)",
            minHeight: "100px",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        {selectedAnswer && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Độ dài: {selectedAnswer.length} ký tự
          </p>
        )}
      </div>
    );
  }

  // ==================== ESSAY ====================
  if (questionType === "ESSAY") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <textarea
          placeholder="Viết bài luận của bạn..."
          value={selectedAnswer || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid var(--border-color)",
            borderRadius: "8px",
            backgroundColor: "var(--surface-alt)",
            color: "var(--text-color)",
            minHeight: "200px",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <p>Số từ: {(selectedAnswer || "").split(/\s+/).filter((w: string) => w).length}</p>
        </div>
      </div>
    );
  }

  // ==================== DROPDOWN ====================
  if (questionType === "DROPDOWN") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <select
          value={selectedAnswer || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid var(--border-color)",
            borderRadius: "8px",
            backgroundColor: "var(--surface-alt)",
            color: "var(--text-color)",
            cursor: "pointer",
          }}
        >
          <option value="">
            {question.options[0]?.placeholder || "Chọn một tùy chọn..."}
          </option>
          {question.options.map((option: any) => (
            <option key={option.optionId} value={option.optionId}>
              {option.displayLabel || option.dropdownValue}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // ==================== MATCHING ====================
  if (questionType === "MATCHING") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {question.options.map((option: any, idx: number) => (
          <div key={option.optionId} style={{ display: "flex", gap: "1rem" }}>
            <div
              style={{
                flex: 1,
                padding: "1rem",
                backgroundColor: "var(--surface-alt)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <strong>{option.leftItem || `Mục ${idx + 1}`}</strong>
            </div>
            <div style={{ fontSize: "1.5rem" }}>→</div>
            <select
              value={
                (selectedAnswer || {})[option.optionId] ||
                ""
              }
              onChange={(e) =>
                onSelectAnswer({
                  ...selectedAnswer,
                  [option.optionId]: e.target.value,
                })
              }
              style={{
                flex: 1,
                padding: "1rem",
                backgroundColor: "var(--surface-alt)",
                borderRadius: "8px",
                border: "2px solid var(--border-color)",
                cursor: "pointer",
                color: "var(--text-color)",
              }}
            >
              <option value="">Chọn...</option>
              {question.options.map((opt: any) => (
                <option key={opt.optionId} value={opt.optionId}>
                  {opt.rightItem}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  // ==================== ORDERING ====================
  if (questionType === "ORDERING") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          📝 Sắp xếp từ trên xuống dưới (kéo hoặc nhấp để sắp xếp):
        </p>
        {(selectedAnswer || question.options).map(
          (option: any, idx: number) => (
            <div
              key={option.optionId || idx}
              style={{
                padding: "1rem",
                backgroundColor: "var(--surface-alt)",
                border: "2px solid var(--border-color)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                cursor: "move",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  backgroundColor: "var(--primary-color)",
                  color: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                }}
              >
                {idx + 1}
              </div>
              <span>{option.item || "Mục"}</span>
            </div>
          )
        )}
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          💡 Giá trị được gửi: Thứ tự hiện tại
        </p>
      </div>
    );
  }

  // ==================== DRAG & DROP ====================
  if (questionType === "DRAG_DROP") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          📌 Kéo các mục vào các khu vực thích hợp:
        </div>

        {/* Draggable items */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--surface-alt)",
            borderRadius: "8px",
            border: "2px dashed var(--border-color)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {question.options.map((option: any) => (
            <div
              key={option.optionId}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "var(--primary-color)",
                color: "#fff",
                borderRadius: "4px",
                cursor: "grab",
                userSelect: "none",
              }}
            >
              {option.draggableItem || "Mục"}
            </div>
          ))}
        </div>

        {/* Drop zones */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "1rem",
          }}
        >
          {[...new Set(question.options.map((o: any) => o.dropZoneId))].map(
            (zoneId) => (
              <div
                key={zoneId}
                style={{
                  padding: "1.5rem",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  border: "2px dashed var(--primary-color)",
                  borderRadius: "8px",
                  minHeight: "80px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              >
                <div>Kéo vào đây</div>
                <div style={{ fontSize: "0.8rem" }}>({zoneId})</div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // ==================== HOTSPOT ====================
  if (questionType === "HOTSPOT") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {question.options[0]?.imageUrl && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={question.options[0].imageUrl}
              alt="Hotspot"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "8px",
              }}
            />
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                textAlign: "center",
              }}
            >
              💡 Nhấp vào các điểm nóng trên hình ảnh
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==================== MATRIX ====================
  if (questionType === "MATRIX") {
    const rows = [...new Set(question.options.map((o: any) => o.rowId))];
    const cols = [...new Set(question.options.map((o: any) => o.columnId))];

    return (
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "var(--surface-alt)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                Câu hỏi
              </th>
              {cols.map((col) => (
                <th key={col} style={{ padding: "1rem", fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} style={{ borderTop: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem", fontWeight: 500 }}>{row}</td>
                {cols.map((col) => (
                  <td
                    key={`${row}-${col}`}
                    style={{ padding: "0.5rem", textAlign: "center" }}
                  >
                    <input
                      type="radio"
                      name={row}
                      value={`${row}-${col}`}
                      checked={selectedAnswer === `${row}-${col}`}
                      onChange={() =>
                        onSelectAnswer(`${row}-${col}`)
                      }
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ==================== RANKING ====================
  if (questionType === "RANKING") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          🏆 Xếp hạng từ 1 (cao nhất) đến {question.options.length} (thấp nhất):
        </p>
        {question.options.map((option: any, idx: number) => (
          <div
            key={option.optionId}
            style={{
              padding: "1rem",
              backgroundColor: "var(--surface-alt)",
              border: "2px solid var(--border-color)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <input
              type="number"
              min="1"
              max={question.options.length}
              placeholder="Xếp hạng"
              value={
                (selectedAnswer || {})[option.optionId] || ""
              }
              onChange={(e) =>
                onSelectAnswer({
                  ...selectedAnswer,
                  [option.optionId]: e.target.value,
                })
              }
              style={{
                width: "60px",
                padding: "0.5rem",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                textAlign: "center",
              }}
            />
            <span>{option.rankableItem || "Mục"}</span>
          </div>
        ))}
      </div>
    );
  }

  // ==================== UNSUPPORTED TYPE ====================
  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "2px solid var(--danger-color)",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "var(--danger-color)", fontWeight: 600 }}>
        ⚠️ Loại câu hỏi không được hỗ trợ: {questionType}
      </p>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Vui lòng liên hệ với quản trị viên để cập nhật.
      </p>
    </div>
  );
};

export default OptionsRenderer;     