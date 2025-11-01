import React from "react";
import { Card, Tag, Typography, Space } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { ArticleDto } from "@/types/article";

const { Text, Title } = Typography;

interface ArticleCardProps {
  article: ArticleDto;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "green";
      case "INTERMEDIATE":
        return "orange";
      case "ADVANCED":
        return "red";
      default:
        return "default";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "Cơ bản";
      case "INTERMEDIATE":
        return "Trung bình";
      case "ADVANCED":
        return "Nâng cao";
      default:
        return difficulty;
    }
  };

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
          transition: "all 0.3s ease",
          backgroundColor: "#fff",
          height: "420px",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.08)";
        }}
        bodyStyle={{
          padding: "10px",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Thumbnail */}
        <div
        style={{
            width: "100%",
            height: "180px",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#f0f2f5",
            position: "relative",
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
                objectFit: "cover",      // 👈 giữ tỉ lệ ảnh, cắt vừa khung
                objectPosition: "center", // 👈 canh giữa ảnh
                transition: "transform 0.4s ease",
                display: "block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
        ) : (
            <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            >
            <FolderOutlined style={{ fontSize: "56px", color: "white", opacity: 0.7 }} />
            </div>
        )}
        </div>


        {/* Content */}
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
                      flexDirection: "column",
            padding: "6px 10px",
          }}
        >
          <div className="mt-3">
            <Space wrap size={[8, 8]} className="mb-2">
              <Tag
                color={getDifficultyColor(article.difficulty)}
                style={{
                  fontWeight: 500,
                  fontSize: "13px",
                  borderRadius: "16px",
                }}
              >
                {getDifficultyText(article.difficulty)}
              </Tag>
              {article.category && (
                <Tag
                  color="blue"
                  style={{
                    fontWeight: 500,
                    fontSize: "13px",
                    borderRadius: "16px",
                  }}
                >
                  <FolderOutlined style={{ marginRight: "4px" }} />
                  {article.category.name}
                </Tag>
              )}
            </Space>

            <Title
              level={4}
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: "1.6",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  wordBreak: "break-word",
                  height: "3.2em",
                }}
              >
                {article.title}
              </div>
            </Title>
          </div>

          {/* Meta info */}
          <div style={{ marginTop: "12px", color: "#595959", fontSize: "13px" }}>
            <div className="d-flex align-items-center mb-2">
              <UserOutlined style={{ marginRight: "6px" }} />
              <Text>{article.authorName || "Admin"}</Text>
            </div>

            <div className="d-flex align-items-center justify-content-between">
              <span>
                <ClockCircleOutlined style={{ marginRight: "6px" }} />
                {new Date(article.createdAt).toLocaleDateString("vi-VN")} •{" "}
                {article.readingTime} phút đọc
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

export default ArticleCard;
