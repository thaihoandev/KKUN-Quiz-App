// src/components/articles/ArticleCardHorizontal.tsx
import React from "react";
import { Card, Typography, Space, Tag } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { ArticleDto } from "@/types/article";

const { Title, Paragraph } = Typography;

interface ArticleCardHorizontalProps {
  article: ArticleDto;
}

const ArticleCardHorizontal: React.FC<ArticleCardHorizontalProps> = ({ article }) => {
  return (
    <Link
      to={`/articles/${article.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card
        hoverable
        className="border-0 shadow-sm"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          transition: "all 0.3s ease",
          height: "260px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
        }}
        bodyStyle={{ padding: 0, display: "flex", flex: 1 }}
      >
        {/* === Thumbnail + overlay === */}
        <div
          style={{
            width: "40%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                filter: "blur(2px) brightness(0.85)", // 👈 làm mờ nhẹ + tối ảnh
                transform: "scale(1.05)",
                transition: "transform 0.6s ease, filter 0.4s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "blur(1px) brightness(0.95)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "blur(2px) brightness(0.85)")
              }
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #60a5fa, #818cf8)",
              }}
            />
          )}

          {/* === Overlay title === */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "20px 24px",
              color: "#fff",
            }}
          >
            <Title
              level={2}
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                lineHeight: "1.3",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)", // 👈 tạo chiều sâu, chữ nổi bật
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                display: "-webkit-box",
              }}
            >
              {article.title}
            </Title>
          </div>

        </div>

        {/* === Content === */}
        <div
          style={{
            flex: 1,
            padding: "22px 26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Description */}
          <Paragraph
            ellipsis={{ rows: 3 }}
            style={{
              fontSize: "16px",
              color: "#333",
              lineHeight: 1.7,
              marginBottom: "20px",
            }}
          >
            {article.contentMarkdown ||
              "No preview available for this article. Click to read more..."}
          </Paragraph>

          {/* Meta info */}
          <div>
            <Space wrap size={[8, 8]} className="mb-2">
              {article.category && (
                <Tag color="blue" style={{ borderRadius: "14px", fontWeight: 500 }}>
                  <FolderOutlined /> {article.category.name}
                </Tag>
              )}
            </Space>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "14px",
                color: "#666",
              }}
            >
              <span>
                <UserOutlined /> {article.authorName || "Admin"} •{" "}
                <ClockCircleOutlined />{" "}
                {new Date(article.createdAt).toLocaleDateString("vi-VN")} •{" "}
                {article.readingTime} phút
              </span>
              {article.views !== undefined && (
                <span>
                  <EyeOutlined style={{ marginRight: "4px" }} />
                  {article.views}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ArticleCardHorizontal;
