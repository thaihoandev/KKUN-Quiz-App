import React from "react";
import { Button } from "antd";

interface LoadMorePaginationProps {
  current: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  onLoadMore: () => void;
}

const LoadMorePagination: React.FC<LoadMorePaginationProps> = ({
  current,
  total,
  pageSize,
  loading,
  onLoadMore,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = current < totalPages;

  if (!hasMore) {
    return (
      <div className="text-center text-muted py-3">
        🎉 Đã hiển thị tất cả {total} mục
      </div>
    );
  }

  return (
    <div className="text-center mt-3">
      <Button
        type="primary"
        size="large"
        loading={loading}
        onClick={onLoadMore}
        style={{ borderRadius: 12, minWidth: 180 }}
      >
        Xem thêm
      </Button>
    </div>
  );
};

export default LoadMorePagination;
