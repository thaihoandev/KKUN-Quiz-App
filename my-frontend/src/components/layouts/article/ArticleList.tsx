import React, { useEffect, useState } from "react";
import { getArticles, getArticlesByCategory, PageResponse } from "@/services/articleService";
import { ArticleDto } from "@/types/article";
import { FolderOutlined } from "@ant-design/icons";
import { Row, Col, Empty, Spin, Space, Typography, Pagination, message } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";
import ArticleCard from "./ArticleCard";
import ArticleCardHorizontal from "./ArticleCardHorizontal";

const { Text } = Typography;

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <Spin size="large" tip="Đang tải bài viết..." />
      </div>
    );
  }

  if (!articlesPage || articlesPage.content.length === 0) {
    return (
      <div className="py-5 bg-light">
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
    <div className="py-4 bg-light">
      <Row gutter={[0, 20]}>
        {articlesPage.content.map((article) => (
          <Col span={24} key={article.id}>
            <ArticleCardHorizontal article={article} />
          </Col>
        ))}
      </Row>


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
