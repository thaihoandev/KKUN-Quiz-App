import React, { useState } from "react";

interface OptionDTO {
  optionId: string;
  type: string;
  text?: string;
  imageUrl?: string;
  correctAnswer?: string;
  [key: string]: any;
}

interface QuestionResponseDTO {
  questionId: string;
  type: string;
  questionText: string;
  options: OptionDTO[];
  timeLimitSeconds?: number;
  [key: string]: any;
}

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
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  console.log();
  
  if (!question.options || question.options.length === 0) {
    return (
      <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>
        Không có tùy chọn
      </p>
    );
  }

  const questionType = question.type;

  // ==================== SINGLE CHOICE ====================
  if (questionType === "SINGLE_CHOICE") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {question.options.map((option) => (
          <label
            key={option.optionId}
            onClick={() => onSelectAnswer(option.optionId)}
            style={{
              padding: "1rem",
              backgroundColor:
                selectedAnswer === option.optionId ? "#3b82f6" : "#f5f5f5",
              color: selectedAnswer === option.optionId ? "#fff" : "#000",
              border: "2px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s",
            }}
          >
            <input
              type="radio"
              checked={selectedAnswer === option.optionId}
              onChange={() => {}}
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
        {question.options.map((option) => (
          <label
            key={option.optionId}
            onClick={() => {
              const current = selectedAnswer || [];
              if (current.includes(option.optionId)) {
                onSelectAnswer(
                  current.filter((id: string) => id !== option.optionId)
                );
              } else {
                onSelectAnswer([...current, option.optionId]);
              }
            }}
            style={{
              padding: "1rem",
              backgroundColor: (selectedAnswer || []).includes(option.optionId)
                ? "#3b82f6"
                : "#f5f5f5",
              color: (selectedAnswer || []).includes(option.optionId)
                ? "#fff"
                : "#000",
              border: "2px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              transition: "all 0.2s",
            }}
          >
            <input
              type="checkbox"
              checked={(selectedAnswer || []).includes(option.optionId)}
              onChange={() => {}}
              style={{ cursor: "pointer" }}
            />
            <span>{option.text || "Tùy chọn"}</span>
          </label>
        ))}
      </div>
    );
  }

  // ==================== TRUE/FALSE ====================
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
                String(selectedAnswer) === btn.value
                  ? "#3b82f6"
                  : "#f5f5f5",
              color:
                selectedAnswer === btn.value ||
                String(selectedAnswer) === btn.value
                  ? "#fff"
                  : "#000",
              border: "2px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
              transition: "all 0.2s",
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
        {question.options.map((option) => (
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
                  ? "3px solid #3b82f6"
                  : "2px solid #ddd",
              transition: "all 0.2s",
              opacity: selectedAnswer === option.optionId ? 1 : 0.7,
            }}
          >
            <img
              src={
                option.imageUrl ||
                option.thumbnailUrl ||
                "https://via.placeholder.com/150"
              }
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
          placeholder="Nhập câu trả lời..."
          value={selectedAnswer || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        />
        {selectedAnswer && (
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
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
          placeholder="Nhập câu trả lời ngắn..."
          value={selectedAnswer || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
            minHeight: "100px",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        {selectedAnswer && (
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            Độ dài: {selectedAnswer.length} ký tự
          </p>
        )}
      </div>
    );
  }

  // ==================== ESSAY ====================
  if (questionType === "ESSAY") {
    const wordCount = (selectedAnswer || "")
      .split(/\s+/)
      .filter((w: string) => w).length;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <textarea
          placeholder="Viết bài luận..."
          value={selectedAnswer || ""}
          onChange={(e) => onSelectAnswer(e.target.value)}
          style={{
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
            minHeight: "200px",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          📝 Số từ: {wordCount}
        </p>
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
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="">
            {question.options[0]?.placeholder || "Chọn một tùy chọn..."}
          </option>
          {question.options.map((option) => (
            <option key={option.optionId} value={option.optionId}>
              {option.displayLabel || option.dropdownValue || option.text}
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
        {question.options.map((option, idx) => (
          <div key={option.optionId} style={{ display: "flex", gap: "1rem" }}>
            <div
              style={{
                flex: 1,
                padding: "1rem",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                fontWeight: 600,
              }}
            >
              {option.leftItem || `Mục ${idx + 1}`}
            </div>
            <div style={{ fontSize: "1.5rem", alignSelf: "center" }}>→</div>
            <select
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
                flex: 1,
                padding: "1rem",
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "2px solid #ddd",
                cursor: "pointer",
              }}
            >
              <option value="">Chọn...</option>
              {question.options.map((opt) => (
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
    const [orderingItems, setOrderingItems] = useState(
      selectedAnswer || question.options
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
          📝 Sắp xếp từ trên xuống dưới (kéo để thay đổi thứ tự):
        </p>
        {orderingItems.map((option: any, idx: number) => (
          <div
            key={option.optionId || idx}
            draggable
            onDragStart={() => setDraggedItem(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedItem !== null && draggedItem !== idx) {
                const newItems = [...orderingItems];
                [newItems[draggedItem], newItems[idx]] = [
                  newItems[idx],
                  newItems[draggedItem],
                ];
                setOrderingItems(newItems);
                onSelectAnswer(newItems);
              }
            }}
            onDragEnd={() => setDraggedItem(null)}
            style={{
              padding: "1rem",
              backgroundColor: "#f5f5f5",
              border: "2px solid #ddd",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              cursor: "move",
              userSelect: "none",
              opacity: draggedItem === idx ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                backgroundColor: "#3b82f6",
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
            <span>{option.item || option.text || "Mục"}</span>
          </div>
        ))}
      </div>
    );
  }

  // ==================== DRAG & DROP ====================
  if (questionType === "DRAG_DROP") {
    const zones = [
      ...new Set(question.options.map((o) => o.dropZoneId)),
    ] as string[];
    const [droppedItems, setDroppedItems] = useState(
      selectedAnswer || {}
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Source items */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            border: "2px dashed #999",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {question.options
            .filter((opt) => !Object.values(droppedItems).includes(opt.optionId))
            .map((option) => (
              <div
                key={option.optionId}
                draggable
                onDragStart={() => setDraggedItem(option.optionId)}
                onDragEnd={() => setDraggedItem(null)}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  borderRadius: "6px",
                  cursor: "grab",
                  userSelect: "none",
                  opacity: draggedItem === option.optionId ? 0.5 : 1,
                }}
              >
                {option.draggableItem || option.text}
              </div>
            ))}
        </div>

        {/* Drop zones */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          {zones.map((zoneId) => (
            <div
              key={zoneId}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverZone(zoneId);
              }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={() => {
                if (draggedItem) {
                  setDroppedItems({
                    ...droppedItems,
                    [zoneId]: draggedItem,
                  });
                  onSelectAnswer({
                    ...droppedItems,
                    [zoneId]: draggedItem,
                  });
                  setDraggedItem(null);
                  setDragOverZone(null);
                }
              }}
              style={{
                padding: "2rem 1rem",
                backgroundColor:
                  dragOverZone === zoneId
                    ? "rgba(59, 130, 246, 0.2)"
                    : "rgba(99, 102, 241, 0.1)",
                border: "2px dashed #3b82f6",
                borderRadius: "8px",
                minHeight: "100px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
            >
              <div style={{ fontSize: "1.5rem" }}>📥</div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>
                {zoneId}
              </div>
              {droppedItems[zoneId] && (
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {question.options.find(
                    (o) => o.optionId === droppedItems[zoneId]
                  )?.draggableItem}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== HOTSPOT ====================
  if (questionType === "HOTSPOT") {
    const imageUrl = question.options[0]?.imageUrl;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
          💡 Nhấp vào vị trí trên hình ảnh:
        </p>
        {imageUrl && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={imageUrl}
              alt="Hotspot"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "8px",
                display: "block",
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                onSelectAnswer({
                  hotspotId: question.options[0].optionId,
                  x: Math.round(x),
                  y: Math.round(y),
                });
              }}
            />
            {selectedAnswer && (
              <div
                style={{
                  position: "absolute",
                  left: selectedAnswer.x - 10,
                  top: selectedAnswer.y - 10,
                  width: "20px",
                  height: "20px",
                  backgroundColor: "rgba(59, 130, 246, 0.5)",
                  border: "2px solid #3b82f6",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        )}
        {selectedAnswer && (
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            📍 Tọa độ: ({selectedAnswer.x}, {selectedAnswer.y})
          </p>
        )}
      </div>
    );
  }

  // ==================== MATRIX ====================
  if (questionType === "MATRIX") {
    const rows = [...new Set(question.options.map((o) => o.rowId))];
    const cols = [...new Set(question.options.map((o) => o.columnId))];

    return (
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
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
              <tr key={row} style={{ borderTop: "1px solid #ddd" }}>
                <td style={{ padding: "1rem", fontWeight: 500 }}>{row}</td>
                {cols.map((col) => (
                  <td
                    key={`${row}-${col}`}
                    style={{ padding: "1rem", textAlign: "center" }}
                  >
                    <input
                      type="radio"
                      name={row}
                      value={`${row}-${col}`}
                      checked={selectedAnswer === `${row}-${col}`}
                      onChange={() => onSelectAnswer(`${row}-${col}`)}
                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
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
        <p style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
          🏆 Xếp hạng từ 1 (cao nhất) đến {question.options.length} (thấp nhất):
        </p>
        {question.options.map((option) => (
          <div
            key={option.optionId}
            style={{
              padding: "1rem",
              backgroundColor: "#f5f5f5",
              border: "2px solid #ddd",
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
                width: "70px",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                textAlign: "center",
              }}
            />
            <span>{option.rankableItem || option.text}</span>
          </div>
        ))}
      </div>
    );
  }

  // ==================== UNSUPPORTED ====================
  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "#fee2e2",
        border: "2px solid #ef4444",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#ef4444", fontWeight: 600, margin: "0 0 0.5rem 0" }}>
        ⚠️ Loại câu hỏi không được hỗ trợ
      </p>
      <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
        Loại: {questionType}
      </p>
    </div>
  );
};

export default OptionsRenderer;