import React from "react";
import { Modal, Select, Typography, Divider, Avatar, Space } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { SeriesDto } from "@/types/series";
import { ArticleDto } from "@/types/article";

const { Text, Title } = Typography;

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
  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 600,
            padding: "1rem"
          }}
        >
          <BookOutlined style={{ color: "var(--primary-dark)", fontSize: 20 }} />
          <span>Thêm bài viết vào Series</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Thêm"
      cancelText="Hủy"
      centered
      bodyStyle={{ paddingTop: 8, paddingBottom: 16 }}
    >
      {/* Phần hiển thị bài viết được chọn */}
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#e5e7eb",
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
                color: "#999",
                background: "linear-gradient(135deg, #93c5fd, #3b82f6)",
              }}
            >
              <BookOutlined style={{ fontSize: 26, color: "white" }} />
            </div>
          )}
        </div>

        {/* Thông tin bài viết */}
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Bài viết đang chọn
          </Text>
          <Title
            level={5}
            style={{
              marginTop: 4,
              marginBottom: 0,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {selectedArticle?.title || "—"}
          </Title>
        </div>
      </div>

      <Divider style={{ margin: "10px 0 16px" }} />

      {/* Select series */}
      <div style={{ marginBottom: 6 }}>
        <Text strong>Chọn series:</Text>
      </div>

      <Select
        placeholder="Chọn series để thêm bài viết vào"
        value={selectedSeriesId || undefined}
        onChange={setSelectedSeriesId}
        style={{ width: "100%" }}
        size="large"
        options={seriesList.map((s) => ({
          label: (
            <Space align="center">
              <Avatar
                size={22}
                src={s.thumbnailUrl}
                icon={!s.thumbnailUrl && <BookOutlined />}
              />
              <Text>{s.title}</Text>
            </Space>
          ),
          value: s.id,
        }))}
      />

      {/* Gợi ý dưới */}
      <div style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
        <Text type="secondary">
          📘 Mỗi bài viết chỉ có thể thuộc về một series. Hãy chọn series phù hợp
          nhất.
        </Text>
      </div>
    </Modal>
  );
};

export default SelectSeriesModal;
