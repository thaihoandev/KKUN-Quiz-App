import React from "react";
import { ArticleDto } from "@/types/article";
import { Card, Tag, Avatar, Divider, Space, Breadcrumb, Typography } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  FileTextOutlined,
  HomeOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import MDEditor from "@uiw/react-md-editor";

const { Title, Text } = Typography;

interface Props {
  article: ArticleDto;
}

const ArticleDetail: React.FC<Props> = ({ article }) => {
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
    <div
      style={{
        background: "var(--background-color)",
        color: "var(--text-color)",
        minHeight: "100vh",
        transition: "background-color 0.4s ease, color 0.4s ease",
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          background: "var(--surface-color)",
          boxShadow: "var(--card-shadow)",
          padding: "1rem 0",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
          <Breadcrumb
            separator="→"
            style={{ fontSize: "14px", fontWeight: 500 }}
            items={[
              {
                href: "/",
                title: (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <HomeOutlined style={{ color: "var(--primary-color)" }} />
                    <span>Trang chủ</span>
                  </div>
                ),
              },
              {
                href: "/articles",
                title: (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileTextOutlined style={{ color: "var(--primary-color)" }} />
                    <span>Bài viết</span>
                  </div>
                ),
              },
              {
                title: (
                  <Text
                    ellipsis
                    style={{
                      maxWidth: "300px",
                      color: "var(--text-light)",
                    }}
                  >
                    {article.title}
                  </Text>
                ),
              },
            ]}
          />
        </div>
      </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <Card
          style={{
            borderRadius: "var(--border-radius)",
            overflow: "hidden",
            background: "var(--surface-color)",
            border: "none",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Thumbnail */}
          {article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "cover",
                borderRadius: "var(--border-radius)",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "400px",
                background: "var(--surface-alt)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--border-radius)",
              }}
            >
              <FileTextOutlined
                style={{
                  fontSize: "64px",
                  color: "var(--text-muted)",
                }}
              />
            </div>
          )}

          <div style={{ padding: "2rem" }}>
            {/* Tags and Difficulty */}
            <Space wrap style={{ marginBottom: "1.5rem" }}>
              <Tag
                color={getDifficultyColor(article.difficulty || "BEGINNER")}
                style={{
                  fontSize: "14px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontWeight: 500,
                }}
              >
                {getDifficultyText(article.difficulty || "BEGINNER")}
              </Tag>
              {article.category && (
                <Tag
                  color="blue"
                  style={{
                    fontSize: "14px",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontWeight: 500,
                  }}
                >
                  <FolderOutlined style={{ marginRight: "6px" }} />
                  {article.category.name}
                </Tag>
              )}
            </Space>

            {/* Title */}
            <Title
              level={1}
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                lineHeight: "1.3",
                color: "var(--text-color)",
                marginBottom: "1.5rem",
              }}
            >
              {article.title}
            </Title>

            {/* Author + Meta Info */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
                borderBottom: "2px solid var(--border-color)",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <Avatar
                  src={article.authorAvatar || undefined}
                  icon={!article.authorAvatar && <UserOutlined />}
                  size={48}
                  style={{
                    background: "var(--gradient-primary)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "16px",
                      color: "var(--text-color)",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {article.authorName || "Tác giả không xác định"}
                  </Text>
                  <div style={{ fontSize: "13px", color: "var(--text-light)" }}>Tác giả</div>
                </div>
              </div>

              <Space
                size="large"
                style={{
                  fontSize: "14px",
                  color: "var(--text-light)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                }}
              >
                {/* Ngày đăng */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ClockCircleOutlined />
                  <span>
                    {new Date(article.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Thời gian đọc */}
                {article.readingTime !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileTextOutlined />
                    <span>{article.readingTime} phút đọc</span>
                  </div>
                )}

                {/* Lượt xem */}
                {article.views !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <EyeOutlined />
                    <span>{article.views} lượt xem</span>
                  </div>
                )}
              </Space>
            </div>

            {/* Article Content */}
            <div
              className="article-content"
              data-color-mode={document.documentElement.classList.contains("dark-mode") ? "dark" : "light"}
              style={{
                fontSize: "18px",
                lineHeight: "1.8",
                color: "var(--text-color)",
                background: "transparent",
                marginBottom: "2rem",
              }}
            >
              <MDEditor.Markdown 
                source={article.contentMarkdown || ""} 
                style={{
                  background: "transparent",
                  color: "var(--text-color)",
                }}
              />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <>
                <Divider style={{ margin: "2rem 0", borderColor: "var(--border-color)" }} />
                <div>
                  <Title
                    level={4}
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "1rem",
                      color: "var(--text-color)",
                    }}
                  >
                    Tags
                  </Title>
                  <Space wrap>
                    {article.tags.map((t) => (
                      <Tag
                        key={t.id}
                        color="cyan"
                        style={{
                          fontSize: "14px",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontWeight: 500,
                        }}
                      >
                        #{t.name}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ArticleDetail;