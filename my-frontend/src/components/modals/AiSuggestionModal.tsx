import { QuestionResponseDTO } from "@/services/questionService";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

type Props = {
  show: boolean;
  loading?: boolean;
  loadingMessage?: string;
  questions: QuestionResponseDTO[];
  onClose: () => void;
  onAccept: (selected: QuestionResponseDTO[]) => void;
};

const getQKey = (q: QuestionResponseDTO, idx: number): string => {
  if (!q) return `fallback-${idx}-${Date.now()}`;
  const key = (q as any).clientKey || (q as any).questionId || `idx-${idx}`;
  return String(key);
};

const AiSuggestionModal: React.FC<Props> = ({
  show,
  loading,
  loadingMessage = "Đang xử lý...",
  questions,
  onClose,
  onAccept,
}) => {
  const validQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.filter((q) => q && typeof q === "object");
  }, [questions]);

  const total = validQuestions.length;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedKeyRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlySelectedView, setOnlySelectedView] = useState(false);

  useEffect(() => {
    if (!show) {
      const timer = setTimeout(() => {
        setSelected(new Set());
        setQuery("");
        setOnlySelectedView(false);
        lastClickedKeyRef.current = null;
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSelected(new Set());
      setQuery("");
      setOnlySelectedView(false);
      lastClickedKeyRef.current = null;
    }
  }, [show]);

  useEffect(() => {
    return () => {
      setSelected(new Set());
      setQuery("");
      setOnlySelectedView(false);
      lastClickedKeyRef.current = null;
    };
  }, []);

  const allKeys = useMemo(
    () => validQuestions.map((q, i) => getQKey(q, i)),
    [validQuestions]
  );

  const filteredIndexes = useMemo(() => {
    if (total === 0) return [];
    const q = query.trim().toLowerCase();
    const indices: number[] = [];

    validQuestions.forEach((item, i) => {
      if (!q) {
        indices.push(i);
        return;
      }

      const questionText = item?.questionText || "";
      const optionsText = (item?.options || [])
        .map((o: any) => o?.text || "")
        .join(" ");

      const haystack = `${questionText} ${optionsText}`.toLowerCase();
      if (haystack.includes(q)) indices.push(i);
    });

    return indices;
  }, [validQuestions, query, total]);

  const visibleIndexes = useMemo(() => {
    if (total === 0) return [];
    if (!onlySelectedView) return filteredIndexes;
    return filteredIndexes.filter((i) => {
      const key = getQKey(validQuestions[i], i);
      return selected.has(key);
    });
  }, [validQuestions, filteredIndexes, onlySelectedView, selected, total]);

  const allVisibleKeys = useMemo(() => {
    return visibleIndexes.map((i) => getQKey(validQuestions[i], i));
  }, [validQuestions, visibleIndexes]);

  const setSelectedKeys = useCallback((keys: string[]) => {
    setSelected(new Set(keys));
  }, []);

  const toggle = useCallback((key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(key) : next.delete(key);
      return next;
    });
  }, []);

  const toggleWithRange = useCallback(
    (key: string, idx: number, checked: boolean, withRange: boolean) => {
      if (!withRange || lastClickedKeyRef.current == null) {
        lastClickedKeyRef.current = key;
        toggle(key, checked);
        return;
      }

      const lastKey = lastClickedKeyRef.current;
      const lastIdx = visibleIndexes.findIndex(
        (i) => getQKey(validQuestions[i], i) === lastKey
      );
      const curIdx = visibleIndexes.findIndex(
        (i) => getQKey(validQuestions[i], i) === key
      );

      if (lastIdx === -1 || curIdx === -1) {
        lastClickedKeyRef.current = key;
        toggle(key, checked);
        return;
      }

      const [start, end] =
        lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
      const rangeKeys = visibleIndexes
        .slice(start, end + 1)
        .map((i) => getQKey(validQuestions[i], i));

      setSelected((prev) => {
        const next = new Set(prev);
        rangeKeys.forEach((rk) => (checked ? next.add(rk) : next.delete(rk)));
        return next;
      });
      lastClickedKeyRef.current = key;
    },
    [validQuestions, visibleIndexes, toggle]
  );

  const selectAllVisible = useCallback(
    () => setSelectedKeys(allVisibleKeys),
    [allVisibleKeys, setSelectedKeys]
  );

  const clearAll = useCallback(() => setSelected(new Set()), []);

  const invertVisible = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      allVisibleKeys.forEach((k) => {
        if (next.has(k)) next.delete(k);
        else next.add(k);
      });
      return next;
    });
  }, [allVisibleKeys]);

  const acceptSelected = useCallback(() => {
    if (selected.size === 0) {
      onAccept([]);
      return;
    }

    const out: QuestionResponseDTO[] = [];
    validQuestions.forEach((q, i) => {
      if (selected.has(getQKey(q, i))) out.push(q);
    });
    onAccept(out);
  }, [onAccept, validQuestions, selected]);

  const selectedCount = selected.size;
  const visibleSelectedCount = useMemo(
    () => allVisibleKeys.filter((k) => selected.has(k)).length,
    [allVisibleKeys, selected]
  );

  const allVisibleChecked =
    visibleSelectedCount > 0 && visibleSelectedCount === allVisibleKeys.length;
  const partiallyChecked = visibleSelectedCount > 0 && !allVisibleChecked;

  if (!show) return null;

  // Show loading state if no questions yet
  const showLoadingState = loading && total === 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--overlay-color)",
        backdropFilter: "var(--blur-bg)",
        zIndex: 2000,
        animation: "fadeIn 0.3s ease",
      }}
      onClick={loading ? undefined : onClose}
    >
      <div
        style={{
          maxWidth: "980px",
          width: "90%",
          maxHeight: "90vh",
          transform: "translateY(10px)",
          animation: "slideUp 0.35s ease forwards",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "var(--surface-color)",
            border: "none",
            borderRadius: "var(--border-radius)",
            overflow: "hidden",
            boxShadow: "var(--card-shadow)",
            position: "relative",
            color: "var(--text-color)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--gradient-primary)",
              borderBottom: "none",
              padding: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.5rem",
                    animation: loading ? "pulse 1s ease-in-out infinite" : "none",
                  }}
                >
                  🤖
                </span>
                <h5
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "white",
                  }}
                >
                  {showLoadingState ? "Đang sinh câu hỏi..." : "Gợi ý câu hỏi (AI)"}
                </h5>
              </div>

              {showLoadingState ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span>{loadingMessage}</span>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      background: "rgba(255, 255, 255, 0.25)",
                      color: "white",
                    }}
                  >
                    Tổng: {total}
                  </span>
                  <span
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      background:
                        filteredIndexes.length > 0
                          ? "rgba(255, 255, 255, 0.25)"
                          : "rgba(255, 255, 255, 0.1)",
                      color: "white",
                    }}
                  >
                    Khớp bộ lọc: {filteredIndexes.length}
                  </span>
                  <span
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      background:
                        selectedCount > 0
                          ? "rgba(74, 222, 128, 0.3)"
                          : "rgba(255, 255, 255, 0.1)",
                      color: "white",
                    }}
                  >
                    Đã chọn: {selectedCount}
                  </span>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              style={{
                filter: "brightness(0) invert(1)",
                flexShrink: 0,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            />
          </div>

          {/* Show Loading State */}
          {showLoadingState ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  border: "4px solid var(--border-color)",
                  borderTop: "4px solid var(--primary-color)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "1.5rem",
                }}
              />
              <p style={{ fontSize: "16px", color: "var(--text-color)", margin: 0 }}>
                {loadingMessage}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  margin: "0.5rem 0 0 0",
                }}
              >
                Vui lòng đợi khi hệ thống AI xử lý...
              </p>
            </div>
          ) : total === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "16px",
                  margin: 0,
                }}
              >
                Không có gợi ý nào để hiển thị.
              </p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  background: "var(--surface-alt)",
                  borderBottom: "2px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                  flexShrink: 0,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor:
                      loading || allVisibleKeys.length === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      loading || allVisibleKeys.length === 0 ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allVisibleChecked}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = partiallyChecked;
                      }
                    }}
                    onChange={(e) =>
                      e.target.checked ? selectAllVisible() : invertVisible()
                    }
                    disabled={loading || allVisibleKeys.length === 0}
                    className="form-check-input"
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontWeight: 500, fontSize: "14px" }}>
                    Chọn tất cả (đang hiển thị)
                  </span>
                </label>

                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading || total === 0}
                  className="form-control"
                  style={{
                    maxWidth: "300px",
                    height: "36px",
                    fontSize: "14px",
                  }}
                />

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor:
                      loading || selectedCount === 0 ? "not-allowed" : "pointer",
                    opacity: loading || selectedCount === 0 ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={onlySelectedView}
                    onChange={(e) => setOnlySelectedView(e.target.checked)}
                    disabled={loading || selectedCount === 0}
                    className="form-check-input"
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontWeight: 500, fontSize: "14px" }}>
                    📌 Chỉ hiển thị đã chọn
                  </span>
                </label>
              </div>

              {/* Body - Scrollable List */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  overflowY: "auto",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {visibleIndexes.length === 0 ? (
                  <div
                    style={{
                      padding: "3rem 1.5rem",
                      textAlign: "center",
                      background: "var(--surface-alt)",
                      borderRadius: "var(--border-radius)",
                      border: "2px dashed var(--border-color)",
                    }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                      🔍
                    </div>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      Không tìm thấy câu hỏi khớp bộ lọc
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {visibleIndexes.map((i) => {
                      const q = validQuestions[i];
                      const k = getQKey(q, i);
                      const checked = selected.has(k);

                      return (
                        <div
                          key={k}
                          style={{
                            border: `2px solid ${
                              checked
                                ? "var(--success-color)"
                                : "var(--border-color)"
                            }`,
                            borderRadius: "10px",
                            overflow: "hidden",
                            background: "var(--surface-color)",
                            transition: "all 0.25s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--primary-color)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(96, 165, 250, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = checked
                              ? "var(--success-color)"
                              : "var(--border-color)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {/* Question Header */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.75rem 1rem",
                              background: "var(--surface-alt)",
                              borderBottom: "2px solid var(--border-color)",
                            }}
                          >
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                cursor: loading ? "not-allowed" : "pointer",
                                margin: 0,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={loading}
                                onChange={(e) => {
                                  const mouseEvent = e.nativeEvent as MouseEvent;
                                  toggleWithRange(
                                    k,
                                    i,
                                    e.target.checked,
                                    mouseEvent.shiftKey
                                  );
                                }}
                                className="form-check-input"
                                style={{ margin: 0 }}
                              />
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: "var(--text-muted)",
                                  fontWeight: 500,
                                }}
                              >
                                Câu {i + 1}
                              </span>
                            </label>
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 500,
                                background: checked
                                  ? "var(--success-color)"
                                  : "var(--border-color)",
                                color: checked ? "white" : "var(--text-muted)",
                              }}
                            >
                              {checked ? "✓ Đã chọn" : "○ Chưa chọn"}
                            </span>
                          </div>

                          {/* Question Body */}
                          <div style={{ padding: "0.75rem 1rem" }}>
                            <div
                              style={{
                                fontSize: "14px",
                                color: "var(--text-color)",
                                lineHeight: 1.6,
                                marginBottom: "0.5rem",
                              }}
                            >
                              <strong>Câu hỏi:</strong> {q?.questionText || "Không có nội dung"}
                            </div>
                            {q?.options && q.options.length > 0 && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "var(--text-light)",
                                }}
                              >
                                <strong>Đáp án:</strong>{" "}
                                {q.options
                                  .map((o) => o?.text || "")
                                  .join(" | ")}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  padding: "1rem 1.5rem",
                  background: "var(--surface-alt)",
                  borderTop: "1px solid var(--border-color)",
                  flexShrink: 0,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={selectAllVisible}
                  disabled={loading || allVisibleKeys.length === 0}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "transparent",
                    color: "var(--text-color)",
                    fontWeight: 500,
                    fontSize: "14px",
                    cursor:
                      loading || allVisibleKeys.length === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      loading || allVisibleKeys.length === 0 ? 0.5 : 1,
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && allVisibleKeys.length > 0) {
                      e.currentTarget.style.background = "var(--surface-color)";
                      e.currentTarget.style.borderColor = "var(--primary-color)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  ✓ Chọn tất cả
                </button>

                <button
                  type="button"
                  onClick={invertVisible}
                  disabled={loading || allVisibleKeys.length === 0}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "transparent",
                    color: "var(--text-color)",
                    fontWeight: 500,
                    fontSize: "14px",
                    cursor:
                      loading || allVisibleKeys.length === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      loading || allVisibleKeys.length === 0 ? 0.5 : 1,
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && allVisibleKeys.length > 0) {
                      e.currentTarget.style.background = "var(--surface-color)";
                      e.currentTarget.style.borderColor = "var(--primary-color)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  ⇄ Đảo chọn
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={loading || selectedCount === 0}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "transparent",
                    color: "var(--text-color)",
                    fontWeight: 500,
                    fontSize: "14px",
                    cursor:
                      loading || selectedCount === 0 ? "not-allowed" : "pointer",
                    opacity: loading || selectedCount === 0 ? 0.5 : 1,
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && selectedCount > 0) {
                      e.currentTarget.style.background = "var(--surface-color)";
                      e.currentTarget.style.borderColor = "var(--danger-color)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  ✕ Bỏ chọn
                </button>

                <button
                  type="button"
                  onClick={acceptSelected}
                  disabled={loading || selectedCount === 0}
                  style={{
                    padding: "0.5rem 1.5rem",
                    border: "none",
                    borderRadius: "10px",
                    background: "var(--gradient-primary)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor:
                      loading || selectedCount === 0 ? "not-allowed" : "pointer",
                    opacity: loading || selectedCount === 0 ? 0.5 : 1,
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && selectedCount > 0) {
                      e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  ➕ Thêm ({selectedCount})
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default AiSuggestionModal;