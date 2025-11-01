import React, { useEffect, useState } from "react";
import PromotionCards from "@/components/cards/PromotionCards";
import HeroSection from "@/components/sections/HeroSection";
import QuizListSection from "@/components/sections/QuizListSection";
import { getArticles, PageResponse } from "@/services/articleService";
import { ArticleDto } from "@/types/article";
import { Row, Col, Typography, Button, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { RightOutlined } from "@ant-design/icons";
import ArticleCard from "@/components/layouts/article/ArticleCard";

const { Title } = Typography;

const HomePage: React.FC = () => {
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const response: PageResponse<ArticleDto> = await getArticles(0, 4); // chỉ lấy 4 bài mới
        setArticles(response.content);
      } catch (err) {
        console.error("Không thể tải bài viết:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestArticles();
  }, []);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="app-academy">
        <HeroSection />
        <QuizListSection />

        {/* === BÀI VIẾT MỚI NHẤT === */}
        <section className="my-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Title level={3} className="m-0">
              📰 Bài viết mới nhất
            </Title>
            <Button
              type="link"
              onClick={() => navigate("/articles")}
              className="fw-semibold"
              icon={<RightOutlined />}
            >
              Xem thêm
            </Button>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spin tip="Đang tải bài viết..." />
            </div>
          ) : (
            <Row gutter={[24, 16]}>
              {articles.map((article) => (
                <Col xs={24} sm={12} md={12} lg={6} key={article.id}>
                  <ArticleCard article={article} />
                </Col>
              ))}
            </Row>
          )}
        </section>

        <PromotionCards />
      </div>
    </div>
  );
};

export default HomePage;
