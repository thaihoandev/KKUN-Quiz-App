import React, { useState } from "react";
import { Card, Tag, Space, Dropdown, Button } from "antd";
import {
  FolderOutlined,
  EyeOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined as ViewOutlined,
  CalendarOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { ArticleDto } from "@/types/article";

interface ArticleCardHandleSmallProps {
  article: ArticleDto;
  onAddToSeries?: (article: ArticleDto) => void;
  onDelete?: (id: string) => void;
}

const ArticleCardHandleSmall: React.FC<ArticleCardHandleSmallProps> = ({
  article,
  onAddToSeries,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const menuItems = [
    {
      key: "view",
      label: "Xem bài viết",
      icon: <ViewOutlined />,
      onClick: () => navigate(`/articles/${article.slug}`),
    },
    {
      key: "edit",
      label: "Chỉnh sửa",
      icon: <EditOutlined />,
      onClick: () => navigate(`/articles/edit/${article.slug}`),
    },
    {
      key: "add",
      label: "Thêm vào series",
      icon: <PlusOutlined />,
      onClick: () => onAddToSeries && onAddToSeries(article),
    },
    {
      key: "delete",
      label: "Xóa",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete && onDelete(article.id),
    },
  ];

  return (
    <Card
      hoverable
      className="border-0 shadow-sm"
      style={{
        borderRadius: 14,
        overflow: "hidden",
        transition: "all 0.3s ease",
        minHeight: 260,
        backgroundColor: "#fff",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      bodyStyle={{
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Thumbnail + Overlay toàn ảnh */}
      <div
        style={{
          width: "100%",
          height: 160,
          borderRadius: 10,
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#f0f2f5",
          marginBottom: 10,
        }}
      >
        {/* Ảnh */}
        {article.thumbnailUrl ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              transition: "transform 0.4s ease",
              display: "block",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FolderOutlined style={{ fontSize: 40, color: "white", opacity: 0.8 }} />
          </div>
        )}

        {/* Overlay phủ toàn ảnh */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hovered
              ? "rgba(0, 0, 0, 0.55)"
                          : "rgba(0, 0, 0, 0.35)",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            transition: "background 0.3s ease",
          }}
        >
          {/* Title + 3 chấm */}
          <div
            className="d-flex align-items-start justify-content-between"
            style={{ gap: 8 }}
          >
            {/* ✅ Dùng div thuần, hiển thị 2 dòng rồi ... */}
            <h4
              style={{
                flex: 1,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "1.4em",
                maxHeight: "2.8em",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
              title={article.title}
            >
              {article.title}
            </h4>

            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <button className="btn btn-sm btn-outline-secondary border-0 py-1 px-2 rounded-3" onClick={(e) => e.stopPropagation()}>
                <MoreOutlined style={{ fontSize: 16 }} />
                </button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Meta info dưới thumbnail */}
      <div>
        <div
          className="d-flex align-items-center justify-content-between"
          style={{
            fontSize: 12,
            color: "#595959",
            marginBottom: 6,
          }}
        >
          {article.category && (
            <Tag
              color="blue"
              style={{
                borderRadius: 12,
                fontSize: 11,
                padding: "0 8px",
                marginBottom: 0,
              }}
            >
              {article.category.name}
            </Tag>
          )}

          <Space size={8} style={{ color: "#888" }}>
            <CalendarOutlined />
            {new Date(article.createdAt).toLocaleDateString("vi-VN")}
            {article.views !== undefined && (
              <>
                <EyeOutlined />
                {article.views}
              </>
            )}
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default ArticleCardHandleSmall;
