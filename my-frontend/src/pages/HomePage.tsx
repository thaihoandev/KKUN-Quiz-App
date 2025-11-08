import React, { useEffect, useState } from "react";
import PromotionCards from "@/components/cards/PromotionCards";
import HeroSection from "@/components/sections/HeroSection";
import QuizListSection from "@/components/sections/QuizListSection";
import { getArticles, PageResponse } from "@/services/articleService";
import { ArticleDto } from "@/types/article";
import { Row, Col, Button, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { RightOutlined } from "@ant-design/icons";
import ArticleCard from "@/components/layouts/article/ArticleCard";
import Footer from "@/components/Footer";

const HomePage: React.FC = () => {
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Fetch latest articles
  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const response: PageResponse<ArticleDto> = await getArticles(0, 4);
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
    <>
      <div
        className="container-xxl flex-grow-1 container-p-y"
        style={{
          transition: "background 0.4s ease, color 0.25s ease",
        }}
      >
        <div className="app-academy">
          {/* Hero Section */}
          <HeroSection />

          {/* Quiz List Section */}
          <QuizListSection />

          {/* === BÀI VIẾT MỚI NHẤT === */}
          <section
            className="my-5"
            style={{
              transition: "all 0.25s ease",
            }}
          >
            {/* Header với title và button */}
            <div
              className="d-flex justify-content-between align-items-center mb-4"
              style={{
                paddingBottom: "1.5rem",
                borderBottom: "2px solid var(--border-color)",
                transition: "border-color 0.25s ease",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  letterSpacing: "-0.5px",
                  transition: "color 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.75rem" }}>📰</span>
                Bài viết mới nhất
              </h3>

              <Button
                type="link"
                onClick={() => navigate("/articles")}
                style={{
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "var(--primary-color)",
                  padding: "0.5rem 0.75rem",
                  transition: "color 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                icon={<RightOutlined />}
              >
                Xem thêm
              </Button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div
                className="d-flex justify-content-center align-items-center py-5"
                style={{
                  minHeight: "300px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "1rem",
                }}
              >
                <Spin
                  tip="Đang tải bài viết..."
                  style={{
                    color: "var(--primary-color)",
                  }}
                />
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  Vui lòng chờ...
                </p>
              </div>
            ) : articles.length > 0 ? (
              <Row gutter={[24, 16]}>
                {articles.map((article, index) => (
                  <Col
                    xs={24}
                    sm={12}
                    md={12}
                    lg={6}
                    key={article.id}
                    style={{
                      animation: `slideInUp 0.5s ease forwards`,
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <ArticleCard article={article} />
                  </Col>
                ))}
              </Row>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  backgroundColor: "var(--surface-color)",
                  borderRadius: "14px",
                  border: "2px dashed var(--border-color)",
                  transition: "all 0.25s ease",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Chưa có bài viết nào. Hãy quay lại sau!
                </p>
              </div>
            )}
          </section>

          {/* Promotion Cards */}
          <PromotionCards />
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
    </>
  );
};

export default HomePage;