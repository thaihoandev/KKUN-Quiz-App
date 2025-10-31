import React, { useEffect, useState } from "react";
import { getArticles, getArticlesByCategory, PageResponse } from "@/services/articleService";
import { ArticleDto } from "@/types/article";
import {
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  EyeOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import {
  Card,
  Tag,
  Empty,
  Spin,
  Row,
  Col,
  Typography,
  Space,
  Pagination,
  message,
} from "antd";
import "bootstrap/dist/css/bootstrap.min.css";

const { Text, Title } = Typography;

interface ArticleListProps {
  categoryId: string | null;
  searchQuery?: string;
}

const ArticleList: React.FC<ArticleListProps> = ({ categoryId, searchQuery }) => {
  const [articlesPage, setArticlesPage] = useState<PageResponse<ArticleDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        let response: PageResponse<ArticleDto>;
        if (categoryId) {
          response = await getArticlesByCategory(categoryId, page - 1, pageSize);
        } else {
          response = await getArticles(page - 1, pageSize);
        }

        // Nếu có tìm kiếm, lọc client-side
        if (searchQuery) {
          const keyword = searchQuery.toLowerCase();
          response.content = response.content.filter(
            (a) =>
              a.title.toLowerCase().includes(keyword) ||
              a.category?.name.toLowerCase().includes(keyword)
          );
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
        className="d-flex justify-content-center align-items-center min-vh-100"
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
            <Space direction="vertical" align="center">
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
      <Row gutter={[20, 10]}>
        {articlesPage.content.map((article) => (
          <Col xs={24} sm={12} md={12} lg={6} key={article.id}>
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
                  padding: "20px",
                  flex: "1 1 auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    height: "200px",
                    background: article.thumbnailUrl
                      ? "#f0f0f0"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "12px",
                    overflow: "hidden",
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
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
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

                {/* Content */}
                <div
                  style={{
                    flex: "1 1 auto",
                    display: "flex",
                    flexDirection: "column",
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
                          height: "3.2em", // 2 dòng * 1.6em
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
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-5">
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
