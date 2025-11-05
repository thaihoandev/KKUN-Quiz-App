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
          borderRadius: 16,
          overflow: "hidden",
          transition: "all 0.3s ease",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          height: 420,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = "0 10px 22px rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.08)";
        }}
        bodyStyle={{
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: "100%",
            height: 180,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#f0f2f5",
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
                transition: "transform 0.4s ease",
                display: "block",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderOutlined style={{ fontSize: 56, color: "white", opacity: 0.7 }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: 10,
          }}
        >
          <div>
            <Space wrap size={[8, 8]} className="mb-2">
              <Tag
                color={getDifficultyColor(article.difficulty)}
                style={{ fontWeight: 500, fontSize: 13, borderRadius: 16 }}
              >
                {getDifficultyText(article.difficulty)}
              </Tag>
              {article.category && (
                <Tag color="blue" style={{ fontWeight: 500, fontSize: 13, borderRadius: 16 }}>
                  <FolderOutlined style={{ marginRight: 4 }} />
                  {article.category.name}
                </Tag>
              )}
            </Space>

            <Title
              level={4}
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {article.title}
              </div>
            </Title>
          </div>

          {/* Meta info */}
          <div style={{ marginTop: 10, color: "#595959", fontSize: 13 }}>
            <div className="d-flex align-items-center mb-2">
              <UserOutlined style={{ marginRight: 6 }} />
              <Text>{article.authorName || "Admin"}</Text>
            </div>

            <div className="d-flex align-items-center justify-content-between">
              <span>
                <ClockCircleOutlined style={{ marginRight: 6 }} />
                {new Date(article.createdAt).toLocaleDateString("vi-VN")} •{" "}
                {article.readingTime} phút đọc
              </span>
              {article.views !== undefined && (
                <span>
                  <EyeOutlined style={{ marginRight: 4 }} />
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
