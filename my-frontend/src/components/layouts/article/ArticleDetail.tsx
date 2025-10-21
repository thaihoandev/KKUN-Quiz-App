import React, { useEffect, useState } from "react";
import { getArticleBySlug } from "@/services/articleService";
import { ArticleDto } from "@/types/article";
import { Card, Tag, Spin, Avatar, Divider, Space, Breadcrumb, Typography } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  EyeOutlined,
  HomeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import "bootstrap/dist/css/bootstrap.min.css";

const { Title, Text } = Typography;

const ArticleDetail: React.FC<{ slug?: string }> = ({ slug }) => {
  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      getArticleBySlug(slug)
        .then(setArticle)
        .catch(() => setArticle(null))
        .finally(() => setLoading(false));
    }
  }, [slug]);

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <Spin size="large" tip="Đang tải bài viết..." />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container py-5 text-center" style={{ backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
        <Card className="shadow-sm" style={{ borderRadius: "12px", maxWidth: "600px", margin: "0 auto" }}>
          <Title level={3} style={{ color: "#595959" }}>
            Không tìm thấy bài viết
          </Title>
          <Text type="secondary">Vui lòng kiểm tra lại liên kết hoặc thử một bài viết khác.</Text>
        </Card>
      </div>
    );
  }

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
              <Text ellipsis style={{ maxWidth: "300px" }}>{article.title}</Text>
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-12 col-xl-12">
            {/* Main Card */}
            <Card
              className="shadow-lg border-0"
              style={{ borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff" }}
            >
              {/* Thumbnail */}
              {article.thumbnailUrl ? (
                <div
                  style={{
                    width: "100%",
                    height: "350px",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "16px 16px 0 0",
                  }}
                >
                  <img
                    src={article.thumbnailUrl}
                    alt={article.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "80px",
                      background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                    }}
                  />
                </div>
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

              <div className="p-2 p-md-3">
                {/* Tags and Difficulty */}
                <Space wrap className="mb-4">
                  <Tag
                    color={getDifficultyColor(article.difficulty || "BEGINNER")}
                    style={{
                      fontSize: "14px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                    className="hover-opacity"
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
                        transition: "all 0.2s",
                      }}
                      className="hover-opacity"
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

                {/* Author and Meta Info */}
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-4 border-bottom">
                  <div className="d-flex align-items-center me-4 mb-2">
                    <Avatar
                      src={article.authorId || undefined}
                      icon={!article.authorId && <UserOutlined />}
                      size={48}
                      style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
                    />
                    <div className="ms-3">
                      <Text strong style={{ fontSize: "16px", color: "#1a1a1a" }}>
                        {article.authorId || "Tác giả không xác định"}
                      </Text>
                      <div style={{ fontSize: "13px", color: "#8c8c8c" }}>Tác giả</div>
                    </div>
                  </div>

                  <Space size="large" style={{ fontSize: "14px", color: "#595959" }}>
                    <div className="d-flex align-items-center">
                      <ClockCircleOutlined style={{ marginRight: "6px" }} />
                      <span>
                        {article.createdAt
                          ? new Date(article.createdAt).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </span>
                    </div>
                    {/* {article.viewCount !== undefined && (
                      <div className="d-flex align-items-center">
                        <EyeOutlined style={{ marginRight: "6px" }} />
                        <span>{article.viewCount} lượt xem</span>
                      </div>
                    )} */}
                  </Space>
                </div>

                {/* Article Content */}
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                  style={{
                    fontSize: "18px",
                    lineHeight: "1.8",
                    color: "#333",
                  }}
                />

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
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            className="hover-opacity"
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

      {/* Custom CSS */}
      <style>{`
        .hover-opacity:hover {
          opacity: 0.8;
          transform: translateY(-2px);
        }

        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4,
        .article-content h5,
        .article-content h6 {
          font-weight: 700;
          color: #1a1a1a;
          margin: 1.5em 0 0.8em;
        }

        .article-content h1 {
          font-size: 32px;
        }

        .article-content h2 {
          font-size: 28px;
          border-bottom: 2px solid #e8e8e8;
          padding-bottom: 8px;
        }

        .article-content h3 {
          font-size: 24px;
        }

        .article-content h4 {
          font-size: 20px;
        }

        .article-content p {
          margin-bottom: 1.5em;
          line-height: 1.8;
        }

        .article-content a {
          color: #1890ff;
          text-decoration: none;
          transition: color 0.2s;
        }

        .article-content a:hover {
          color: #40a9ff;
          text-decoration: underline;
        }

        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5em 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .article-content code {
          background-color: #f6f8fa;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          font-size: 0.95em;
          color: #c7254e;
        }

        .article-content pre {
          background-color: #f6f8fa;
          padding: 20px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 1.5em 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .article-content pre code {
          background-color: transparent;
          padding: 0;
          color: #333;
        }

        .article-content blockquote {
          border-left: 4px solid #1890ff;
          padding: 0 0 0 20px;
          margin: 1.5em 0;
          color: #595959;
          font-style: italic;
          background-color: #fafafa;
          border-radius: 4px;
        }

        .article-content ul,
        .article-content ol {
          padding-left: 2em;
          margin-bottom: 1.5em;
        }

        .article-content li {
          margin-bottom: 0.6em;
        }

        .article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .article-content table th,
        .article-content table td {
          border: 1px solid #e8e8e8;
          padding: 12px;
          text-align: left;
        }

        .article-content table th {
          background-color: #f6f8fa;
          font-weight: 600;
          color: #1a1a1a;
        }

        @media (max-width: 768px) {
          .article-content {
            font-size: 16px !important;
          }

          .article-content h1 {
            font-size: 28px;
          }

          .article-content h2 {
            font-size: 24px;
          }

          .article-content h3 {
            font-size: 20px;
          }

          .article-content img {
            margin: 1em 0;
          }

          .ant-card .p-4 {
            padding: 16px !important;
          }

          .ant-card img {
            height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ArticleDetail;