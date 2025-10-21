import React, { useEffect, useState } from "react";
import { getArticles, getArticlesByCategory, PageResponse } from "@/services/articleService";
import { ArticleDto, TagDto } from "@/types/article";
import { ClockCircleOutlined, UserOutlined, FolderOutlined, TagOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { Card, Tag, Empty, Spin, Row, Col, Typography, Space, Pagination, message } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";

const { Text } = Typography;
const { Title } = Typography;

interface ArticleListProps {
  categoryId: string | null;
  searchQuery?: string;
}

const ArticleList: React.FC<ArticleListProps> = ({ categoryId, searchQuery }) => {
  const [articlesPage, setArticlesPage] = useState<PageResponse<ArticleDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // Ant Design page starts from 1
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        let response: PageResponse<ArticleDto>;
        if (categoryId) {
          response = await getArticlesByCategory(categoryId, page - 1, pageSize);
        } else if (searchQuery) {
          // Client-side filtering as fallback
          response = await getArticles(page - 1, pageSize);
          response.content = response.content.filter((article) =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } else {
          response = await getArticles(page - 1, pageSize);
        }
        setArticlesPage(response);
      } catch (error) {
        console.error("Error fetching articles:", error);
        message.error("Không thể tải bài viết!");
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [page, pageSize, categoryId, searchQuery]);

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
      <div
        className="d-flex justify-content-center align-items-center min-vh-100 bg-light animate__animated animate__fadeIn"
        style={{ backgroundColor: "#f5f7fa" }}
      >
        <Spin size="large" tip="Đang tải bài viết..." />
      </div>
    );
  }

  if (!articlesPage || articlesPage.content.length === 0) {
    return (
      <div className="py-5" style={{ backgroundColor: "#f5f7fa" }}>
        <Empty
          description={
            <Space direction="vertical" align="center" className="animate__animated animate__fadeIn">
              <FolderOutlined style={{ fontSize: "56px", color: "#8c8c8c" }} />
              <Text type="secondary">Chưa có bài viết nào</Text>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="py-4" style={{ backgroundColor: "#f5f7fa" }}>
      <Row gutter={[24, 24]} className="animate__animated animate__fadeIn">
        {articlesPage.content.map((article) => (
          <Col xs={24} sm={12} md={12} lg={6} key={article.id}>
            <Link to={`/articles/${article.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card
                hoverable
                className="border-0 shadow-sm"
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  backgroundColor: "#fff",
                  width: "100%",
                  height: "480px", // Fixed height for all cards
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(0, 0, 0, 0.08)";
                }}
                bodyStyle={{ padding: "24px", flex: "1 1 auto", display: "flex", flexDirection: "column" }}
              >
                <div
                  style={{
                    height: "220px",
                    overflow: "hidden",
                    background: article.thumbnailUrl
                      ? "#f0f0f0"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "12px 12px 0 0",
                    flexShrink: 0,
                  }}
                >
                  {article.thumbnailUrl ? (
                    <img
                      alt={article.title}
                      src={article.thumbnailUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FolderOutlined style={{ fontSize: "56px", color: "white", opacity: 0.6 }} />
                    </div>
                  )}
                </div>

                <div
                  style={{
                    flex: "1 1 auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="mt-3">
                    <Space wrap size={[8, 8]} className="mb-2">
                      <Tag
                        color={getDifficultyColor(article.difficulty)}
                        className="rounded-pill px-3 py-1"
                        style={{
                          fontWeight: 500,
                          fontSize: "14px",
                          transition: "all 0.2s",
                        }}
                      >
                        {getDifficultyText(article.difficulty)}
                      </Tag>
                      {article.category && (
                        <Tag
                          color="blue"
                          className="rounded-pill px-3 py-1"
                          style={{
                            fontWeight: 500,
                            fontSize: "14px",
                            transition: "all 0.2s",
                          }}
                        >
                          <FolderOutlined style={{ marginRight: "6px" }} />
                          {article.category.name}
                        </Tag>
                      )}
                    </Space>
                    <Space wrap size={[8, 8]} className="mb-3">
                      {article.tags?.slice(0, 2).map((tag) => (
                        <Tag
                          key={tag.id}
                          color="default"
                          className="rounded-pill px-3 py-1"
                          style={{
                            fontWeight: 500,
                            fontSize: "14px",
                            transition: "all 0.2s",
                          }}
                        >
                          <TagOutlined style={{ marginRight: "6px" }} />
                          {tag.name}
                        </Tag>
                      ))}
                    </Space>

                    <Title
                      level={4}
                      className="mb-2"
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#1a1a1a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: "1.5",
                      }}
                    >
                      {article.title}
                    </Title>
                  </div>

                  <div className="text-muted" style={{ fontSize: "14px" }}>
                    <div className="d-flex align-items-center mb-2">
                      <UserOutlined style={{ marginRight: "8px" }} />
                      <Text style={{ fontSize: "14px" }}>{article.authorId || "Admin"}</Text>
                    </div>
                    <div className="d-flex align-items-center">
                      <ClockCircleOutlined style={{ marginRight: "8px" }} />
                      <Text style={{ fontSize: "14px" }}>
                        {article.createdAt
                          ? new Date(article.createdAt).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-center mt-5 pagination-container">
        <Pagination
          current={page}
          pageSize={pageSize}
          total={articlesPage.totalElements}
          onChange={(p, size) => {
            setPage(p);
            setPageSize(size);
          }}
          showSizeChanger
          pageSizeOptions={[6, 8, 12, 16]}
          showTotal={(total) => `Tổng cộng ${total} bài viết`}
          className="bg-white p-3 rounded-3 shadow-sm"
        />
      </div>
    </div>
  );
};

export default ArticleList;