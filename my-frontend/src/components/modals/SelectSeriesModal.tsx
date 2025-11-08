import React from "react";
import { SeriesDto } from "@/types/series";
import { ArticleDto } from "@/types/article";

interface SelectSeriesModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  seriesList: SeriesDto[];
  selectedSeriesId: string | null;
  setSelectedSeriesId: (id: string | null) => void;
  selectedArticle: ArticleDto | null;
}

const SelectSeriesModal: React.FC<SelectSeriesModalProps> = ({
  open,
  onCancel,
  onConfirm,
  seriesList,
  selectedSeriesId,
  setSelectedSeriesId,
  selectedArticle,
}) => {
  if (!open) return null;

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
      onClick={onCancel}
    >
      <div
        style={{
          maxWidth: "550px",
          width: "90%",
          transform: "translateY(10px)",
          animation: "slideUp 0.35s ease forwards",
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
            }}
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📚</span>
              <h5
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "white",
                }}
              >
                Thêm bài viết vào Series
              </h5>
            </div>

            {/* Close Button */}
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
              aria-label="Close"
              style={{
                filter: "brightness(0) invert(1)",
                flexShrink: 0,
              }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: "1.5rem" }}>
            {/* Selected Article Card */}
            <div
              style={{
                background: "var(--surface-alt)",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.5rem",
                border: "2px solid var(--border-color)",
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "var(--border-color)",
                  flexShrink: 0,
                }}
              >
                {selectedArticle?.thumbnailUrl ? (
                  <img
                    src={selectedArticle.thumbnailUrl}
                    alt={selectedArticle.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--gradient-primary)",
                      color: "white",
                      fontSize: "26px",
                    }}
                  >
                    📄
                  </div>
                )}
              </div>

              {/* Article Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  Bài viết đang chọn
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "var(--text-color)",
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {selectedArticle?.title || "—"}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "var(--border-color)",
                margin: "1rem 0 1.5rem",
              }}
            />

            {/* Select Series */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Chọn series:
              </label>
              <select
                value={selectedSeriesId || ""}
                onChange={(e) => setSelectedSeriesId(e.target.value || null)}
                className="form-select"
                style={{
                  color: "var(--text-color)",
                  fontSize: "15px",
                  padding: "0.75rem 1rem",
                }}
              >
                <option value="">Chọn series để thêm bài viết vào</option>
                {seriesList.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Series List with Thumbnails */}
            {selectedSeriesId && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  background: "var(--light-bg)",
                  borderRadius: "8px",
                  border: "2px solid var(--primary-color)",
                }}
              >
                {seriesList
                  .filter((s) => s.id === selectedSeriesId)
                  .map((series) => (
                    <div
                      key={series.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          backgroundColor: "var(--border-color)",
                          flexShrink: 0,
                        }}
                      >
                        {series.thumbnailUrl ? (
                          <img
                            src={series.thumbnailUrl}
                            alt={series.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "var(--gradient-primary)",
                              color: "white",
                              fontSize: "18px",
                            }}
                          >
                            📚
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--text-color)",
                          }}
                        >
                          {series.title}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "6px",
                          background: "var(--success-color)",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        ✓
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Hint */}
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "var(--surface-alt)",
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--text-muted)",
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "16px" }}>📘</span>
              <span>
                Mỗi bài viết chỉ có thể thuộc về một series. Hãy chọn series phù hợp nhất.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              padding: "1rem 1.5rem",
              background: "var(--surface-alt)",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "0.75rem 1.5rem",
                border: "2px solid var(--border-color)",
                borderRadius: "10px",
                background: "transparent",
                color: "var(--text-color)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-color)";
                e.currentTarget.style.borderColor = "var(--text-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!selectedSeriesId}
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "10px",
                background: "var(--gradient-primary)",
                color: "white",
                fontWeight: 600,
                cursor: !selectedSeriesId ? "not-allowed" : "pointer",
                opacity: !selectedSeriesId ? 0.5 : 1,
                transition: "all 0.25s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (selectedSeriesId) {
                  e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>✓</span>
              <span>Thêm</span>
            </button>
          </div>
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
      `}</style>
    </div>
  );
};

export default SelectSeriesModal;