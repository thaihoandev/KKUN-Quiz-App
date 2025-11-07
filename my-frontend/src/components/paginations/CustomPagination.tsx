import React from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

interface CustomPaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const handlePrev = () => {
    if (current > 1) onChange(current - 1);
  };

  const handleNext = () => {
    if (current < totalPages) onChange(current + 1);
  };

  // Rút gọn danh sách trang nếu dài
  const getVisiblePages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    if (current <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (current >= totalPages - 3)
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];

    return [1, "...", current - 1, current, current + 1, "...", totalPages];
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className="flex items-center justify-center gap-2 mt-5"
      style={{
        flexWrap: "wrap",
        userSelect: "none",
      }}
    >
      {/* Prev */}
      <Tooltip title="Trang trước">
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          onClick={handlePrev}
          disabled={current === 1}
          style={{
            background: "var(--surface-color)",
            borderColor: "var(--border-color)",
            color: "var(--text-color)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget.style.background = "var(--primary-color)"),
            (e.currentTarget.style.color = "white"))
          }
          onMouseLeave={(e) =>
            ((e.currentTarget.style.background = "var(--surface-color)"),
            (e.currentTarget.style.color = "var(--text-color)"))
          }
        />
      </Tooltip>

      {/* Page numbers */}
      {visiblePages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} style={{ padding: "0 6px", color: "var(--text-muted)" }}>
            …
          </span>
        ) : (
          <Button
            key={page}
            shape="circle"
            onClick={() => onChange(Number(page))}
            type={page === current ? "primary" : "default"}
            style={{
              background:
                page === current
                  ? "var(--gradient-primary)"
                  : "var(--surface-color)",
              color: page === current ? "white" : "var(--text-color)",
              border: "2px solid var(--border-color)",
              margin: "0 6px",
              boxShadow: page === current ? "var(--card-shadow)" : "none",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              if (page !== current) {
                e.currentTarget.style.background = "var(--primary-color)";
                e.currentTarget.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (page !== current) {
                e.currentTarget.style.background = "var(--surface-color)";
                e.currentTarget.style.color = "var(--text-color)";
              }
            }}
          >
            {page}
          </Button>
        )
      )}

      {/* Next */}
      <Tooltip title="Trang sau">
        <Button
          shape="circle"
          icon={<RightOutlined />}
          onClick={handleNext}
          disabled={current === totalPages}
          style={{
            background: "var(--surface-color)",
            borderColor: "var(--border-color)",
            color: "var(--text-color)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget.style.background = "var(--primary-color)"),
            (e.currentTarget.style.color = "white"))
          }
          onMouseLeave={(e) =>
            ((e.currentTarget.style.background = "var(--surface-color)"),
            (e.currentTarget.style.color = "var(--text-color)"))
          }
        />
      </Tooltip>
    </div>
  );
};

export default CustomPagination;
