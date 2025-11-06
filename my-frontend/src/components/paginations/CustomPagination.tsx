import React from "react";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handlePrev = () => {
    if (current > 1) onChange(current - 1);
  };

  const handleNext = () => {
    if (current < totalPages) onChange(current + 1);
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        shape="circle"
        icon={<LeftOutlined />}
        onClick={handlePrev}
        disabled={current === 1}
      />

      {/* Render các nút số trang */}
      {pages.map((page) => (
        <Button
          key={page}
          shape="circle"
          type={page === current ? "primary" : "default"}
          onClick={() => onChange(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        shape="circle"
        icon={<RightOutlined />}
        onClick={handleNext}
        disabled={current === totalPages}
      />
    </div>
  );
};

export default CustomPagination;
