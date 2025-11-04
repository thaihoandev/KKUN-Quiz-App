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
    <div style={{ backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm py-3" style={{ borderBottom: "1px solid #e8e8e8" }}>
        <div className="container">
          <Breadcrumb separator=">">
            <Breadcrumb.Item href="/">
              <HomeOutlined style={{ color: "#1890ff" }} />
              <span className="ms-1">Trang chủ</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item href="/articles">
              <FileTextOutlined style={{ color: "#1890ff" }} />
              <span className="ms-1">Bài viết</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Text ellipsis style={{ maxWidth: "300px" }}>
                {article.title}
              </Text>
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-12 col-xl-12">
            <Card
              className="shadow-lg border-0"
              style={{ borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff" }}
            >
              {/* Thumbnail */}
              {article.thumbnailUrl ? (
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  style={{
                    width: "100%",
                    height: "350px",
                    objectFit: "cover",
                    borderRadius: "16px 16px 0 0",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "350px",
                    background: "#e8e8e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "16px 16px 0 0",
                  }}
                >
                  <FileTextOutlined style={{ fontSize: "48px", color: "#8c8c8c" }} />
                </div>
              )}

              <div className="p-3">
                {/* Tags and Difficulty */}
                <Space wrap className="mb-4">
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
                    fontSize: "36px",
                    fontWeight: 700,
                    lineHeight: "1.3",
                    color: "#1a1a1a",
                    marginBottom: "24px",
                  }}
                >
                  {article.title}
                </Title>

                {/* Author + Meta Info */}
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-4 border-bottom">
                  <div className="d-flex align-items-center me-4 mb-2">
                    <Avatar
                      src={article.authorAvatar || undefined}
                      icon={!article.authorAvatar && <UserOutlined />}
                      size={48}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                    <div className="ms-3">
                      <Text strong style={{ fontSize: "16px", color: "#1a1a1a" }}>
                        {article.authorName || "Tác giả không xác định"}
                      </Text>
                      <div style={{ fontSize: "13px", color: "#8c8c8c" }}>Tác giả</div>
                    </div>
                  </div>

                  <Space size="large" style={{ fontSize: "14px", color: "#595959" }}>
                    {/* Ngày đăng */}
                    <div className="d-flex align-items-center">
                      <ClockCircleOutlined style={{ marginRight: "6px" }} />
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
                      <div className="d-flex align-items-center">
                        <FileTextOutlined style={{ marginRight: "6px" }} />
                        <span>{article.readingTime} phút đọc</span>
                      </div>
                    )}

                    {/* Lượt xem */}
                    {article.views !== undefined && (
                      <div className="d-flex align-items-center">
                        <EyeOutlined style={{ marginRight: "6px" }} />
                        <span>{article.views} lượt xem</span>
                      </div>
                    )}
                  </Space>

                </div>

                {/* Article Content */}
                <div
                  className="article-content"
                  data-color-mode="light"
                  style={{
                    fontSize: "18px",
                    lineHeight: "1.8",
                    color: "#333",
                    background: "transparent",
                  }}
                >
                  <MDEditor.Markdown source={article.contentMarkdown || ""} />
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <>
                    <Divider style={{ margin: "32px 0" }} />
                    <div>
                      <Title level={4} style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
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
      </div>
    </div>
  );
};

export default ArticleDetail;
