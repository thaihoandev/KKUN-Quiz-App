import React, { useEffect, useState } from "react";
import { getArticles, getArticlesByCategory, PageResponse } from "@/services/articleService";
import { ArticleDto } from "@/types/article";
import { FolderOutlined } from "@ant-design/icons";
import { Row, Col, Empty, Spin, Space, Typography, message } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";
import ArticleCardHorizontal from "./ArticleCardHorizontal";
import CustomPagination from "@/components/paginations/CustomPagination";

const { Text } = Typography;

interface ArticleListProps {
  categoryId: string | null;
  searchQuery?: string;
}

const ArticleList: React.FC<ArticleListProps> = ({ categoryId, searchQuery }) => {
  const [articlesPage, setArticlesPage] = useState<PageResponse<ArticleDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

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
  }, [page, categoryId, searchQuery]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--background-color)",
          color: "var(--text-color)",
        }}
      >
        <Spin size="large" tip="Đang tải bài viết..." />
      </div>
    );
  }

  if (!articlesPage || articlesPage.content.length === 0) {
    return (
      <div
        style={{
          padding: "2rem 1rem",
          background: "var(--background-color)",
          color: "var(--text-color)",
          borderRadius: "var(--border-radius)",
        }}
      >
        <Empty
          description={
            <Space direction="vertical" align="center">
              <FolderOutlined
                style={{
                  fontSize: "56px",
                  color: "var(--text-color)",
                }}
              />
              <Text style={{ color: "var(--text-light)" }}>Chưa có bài viết nào</Text>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem 0",
        background: "var(--background-color)",
        color: "var(--text-color)",
      }}
    >
      <Row gutter={[0, 20]}>
        {articlesPage.content.map((article, index) => (
          <Col span={24} key={article.id} style={{ animation: `slideInUp 0.5s ease forwards`, animationDelay: `${index * 0.05}s` }}>
            <ArticleCardHorizontal article={article} />
          </Col>
        ))}
      </Row>

      {/* ✅ Custom pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "3rem",
        }}
      >
        <CustomPagination
          current={page}
          total={articlesPage.totalElements}
          pageSize={pageSize}
          onChange={(p) => setPage(p)}
        />
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ArticleList;