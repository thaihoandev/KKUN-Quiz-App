import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ArticleDetail from "@/components/layouts/article/ArticleDetail";
import { ArticleCategoryDto, ArticleDto } from "@/types/article";
import { Card, List, Spin, Typography, Space, Tag, Avatar, message } from "antd";
import {
  FolderOutlined,
  FireOutlined,
  BookOutlined,
} from "@ant-design/icons";
import "bootstrap/dist/css/bootstrap.min.css";
import { getCategories } from "@/services/categoryArticleService";
import {
  getArticlesByCategory,
  getArticleBySlug,
} from "@/services/articleService";
import { getSeriesBySlug } from "@/services/seriesService";

const { Title, Text } = Typography;

interface CategoryWithArticles extends ArticleCategoryDto {
  articles: ArticleDto[];
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [currentArticle, setCurrentArticle] = useState<ArticleDto | null>(null);
  const [categoriesWithArticles, setCategoriesWithArticles] = useState<
    CategoryWithArticles[]
  >([]);
  const [seriesArticles, setSeriesArticles] = useState<ArticleDto[]>([]);
  const [seriesTitle, setSeriesTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getArticleBySlug(slug)
      .then((article) => {
        setCurrentArticle(article);
        console.log("article", article);

        if (article?.series && article.series.slug) {
          fetchSeriesArticles(article.series.slug);
        } else {
          setSeriesArticles([]);
          setSeriesTitle(null);
        }

        if (article?.category?.id) {
          fetchCategoriesAndArticles(article.category.id);
        } else {
          fetchCategoriesAndArticles();
        }
      })
      .catch((error) => {
        console.error("Error fetching article:", error);
        message.error("Không thể tải bài viết. Vui lòng thử lại!");
        setCurrentArticle(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const fetchSeriesArticles = async (seriesSlug: string) => {
    try {
      const series = await getSeriesBySlug(seriesSlug);
      if (series?.articles?.length) {
        setSeriesArticles(series.articles);
        setSeriesTitle(series.title);
      }
    } catch (err) {
      console.error("Failed to fetch series articles:", err);
    }
  };

  const fetchCategoriesAndArticles = async (currentCategoryId?: string) => {
    setSidebarLoading(true);
    try {
      const catRes = await getCategories(0, 5, "name,asc");
      const categories = catRes.content;

      const relevantIds = currentCategoryId
        ? [
            currentCategoryId,
            ...categories
              .filter((c) => c.id !== currentCategoryId)
              .map((c) => c.id),
          ]
        : categories.map((c) => c.id);

      const results = await Promise.all(
        relevantIds.slice(0, 4).map(async (id) => {
          try {
            const artRes = await getArticlesByCategory(id, 0, 5, "createdAt,desc");
            return { id, articles: artRes.content };
          } catch (err) {
            console.error(`Error fetching articles for category ${id}:`, err);
            return { id, articles: [] };
          }
        })
      );

      const updated = categories.map((cat) => {
        const match = results.find((r) => r.id === cat.id);
        return { ...cat, articles: match?.articles || [] };
      });

      if (currentCategoryId) {
        const idx = updated.findIndex((c) => c.id === currentCategoryId);
        if (idx > 0) {
          const currentCat = updated.splice(idx, 1)[0];
          updated.unshift(currentCat);
        }
      }

      setCategoriesWithArticles(
        updated.filter((c) => c.articles.length > 0).slice(0, 4)
      );
    } catch (err) {
      console.error("Error fetching categories and articles:", err);
      message.error("Không thể tải danh sách chuyên mục!");
    } finally {
      setSidebarLoading(false);
    }
  };

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

  if (!currentArticle) {
    return (
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem 1rem",
          background: "var(--background-color)",
          color: "var(--text-color)",
          minHeight: "100vh",
          textAlign: "center",
        }}
      >
        <Text type="danger">Bài viết không tồn tại hoặc đã bị xóa.</Text>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--background-color)",
        color: "var(--text-color)",
        minHeight: "100vh",
        transition: "background-color 0.4s ease, color 0.4s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* Main Content */}
          <div>
            {currentArticle && <ArticleDetail article={currentArticle} />}
          </div>

          {/* Sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              position: "sticky",
              top: "20px",
            }}
          >
            {/* Series Card */}
            {seriesArticles.length > 0 && (
              <Card
                title={
                  <Space>
                    <BookOutlined style={{ color: "#52c41a" }} />
                    <span style={{ fontWeight: 600 }}>
                      Series: <strong>{seriesTitle}</strong>
                    </span>
                  </Space>
                }
                style={{
                  borderRadius: "var(--border-radius)",
                  boxShadow: "var(--card-shadow)",
                  background: "var(--surface-color)",
                  border: "none",
                  overflow: "hidden",
                }}
                bodyStyle={{
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    paddingRight: "0.5rem",
                  }}
                >
                  <List
                    dataSource={seriesArticles}
                    renderItem={(item, index) => {
                      const isActive = item.id === currentArticle.id;
                      return (
                        <List.Item
                          style={{
                            padding: "0.75rem 0.5rem",
                            marginBottom: "0.5rem",
                            borderRadius: "8px",
                            background: isActive
                              ? "var(--gradient-primary)"
                              : "transparent",
                            border: `1px solid ${
                              isActive ? "transparent" : "var(--border-color)"
                            }`,
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background =
                                "var(--surface-alt)";
                              e.currentTarget.style.borderColor =
                                "var(--primary-color)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor =
                                "var(--border-color)";
                            }
                          }}
                        >
                          <Link
                            to={`/articles/${item.slug}`}
                            style={{
                              textDecoration: "none",
                              width: "100%",
                              color: "inherit",
                            }}
                          >
                            <Title
                              level={5}
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                lineHeight: "1.3",
                                color: isActive ? "white" : "var(--text-color)",
                                fontWeight: isActive ? 600 : 500,
                              }}
                            >
                              {index + 1}. {item.title}
                            </Title>
                          </Link>
                        </List.Item>
                      );
                    }}
                    size="small"
                    split={false}
                    locale={{ emptyText: "Chưa có bài viết nào trong series" }}
                  />
                </div>
              </Card>
            )}

            {/* Same Category Card */}
            {currentArticle.category && (
              <Card
                title={
                  <Space>
                    <FolderOutlined style={{ color: "var(--primary-color)" }} />
                    <span style={{ fontWeight: 600 }}>Bài viết cùng chuyên mục</span>
                  </Space>
                }
                style={{
                  borderRadius: "var(--border-radius)",
                  boxShadow: "var(--card-shadow)",
                  background: "var(--surface-color)",
                  border: "none",
                }}
                loading={sidebarLoading}
              >
                <List
                  dataSource={
                    categoriesWithArticles[0]?.articles.slice(0, 5) || []
                  }
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        padding: "1rem 0",
                        borderBottom: "1px solid var(--border-color)",
                        transition: "all 0.2s",
                      }}
                    >
                      <Link
                        to={`/articles/${item.slug}`}
                        style={{
                          textDecoration: "none",
                          width: "100%",
                          display: "flex",
                          gap: "0.75rem",
                          color: "inherit",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              lineHeight: "1.3",
                              color: "var(--text-color)",
                              fontSize: "14px",
                              fontWeight: 500,
                            }}
                          >
                            {item.title}
                          </Title>
                        </div>
                        {item.thumbnailUrl && (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            style={{
                              width: "60px",
                              height: "40px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Link>
                    </List.Item>
                  )}
                  size="small"
                  split={false}
                  locale={{ emptyText: "Không có bài viết nào" }}
                />
              </Card>
            )}

            {/* Other Categories Card */}
            <Card
              title={
                <Space>
                  <FolderOutlined style={{ color: "var(--primary-color)" }} />
                  <span style={{ fontWeight: 600 }}>Các chuyên mục khác</span>
                </Space>
              }
              style={{
                borderRadius: "var(--border-radius)",
                boxShadow: "var(--card-shadow)",
                background: "var(--surface-color)",
                border: "none",
              }}
              loading={sidebarLoading}
            >
              <List
                dataSource={categoriesWithArticles.slice(1)}
                renderItem={(cat) => (
                  <List.Item
                    style={{
                      padding: "0.75rem 0",
                      transition: "all 0.2s",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <Link
                      to={`/articles/category/${cat.id}`}
                      style={{
                        textDecoration: "none",
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "inherit",
                      }}
                    >
                      <Space>
                        <Avatar
                          size={24}
                          style={{
                            background: "var(--gradient-primary)",
                            verticalAlign: "middle",
                            fontWeight: 600,
                          }}
                        >
                          {cat.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <span
                          style={{
                            fontWeight: 500,
                            color: "var(--text-color)",
                          }}
                        >
                          {cat.name}
                        </span>
                      </Space>
                      <Tag color="cyan" style={{ fontWeight: 500 }}>
                        {cat.articles.length}
                      </Tag>
                    </Link>
                  </List.Item>
                )}
                size="small"
                split={false}
                locale={{ emptyText: "Không có chuyên mục nào" }}
              />
            </Card>

            {/* Hot Articles Card */}
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: "#ff4d4f" }} />
                  <span style={{ fontWeight: 600 }}>Bài viết hot</span>
                </Space>
              }
              style={{
                borderRadius: "var(--border-radius)",
                boxShadow: "var(--card-shadow)",
                background: "var(--surface-color)",
                border: "none",
              }}
              loading={sidebarLoading}
            >
              <List
                dataSource={categoriesWithArticles
                  .flatMap((c) => c.articles)
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt || "").getTime() -
                      new Date(a.createdAt || "").getTime()
                  )
                  .slice(0, 5)}
                renderItem={(item, index) => (
                  <List.Item
                    style={{
                      padding: "0.75rem 0",
                      transition: "all 0.2s",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <Link
                      to={`/articles/${item.slug}`}
                      style={{
                        textDecoration: "none",
                        width: "100%",
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                        color: "inherit",
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          width: "24px",
                          textAlign: "center",
                        }}
                      >
                        <strong style={{ color: "#ff4d4f", fontSize: "14px" }}>
                          {index + 1}
                        </strong>
                      </div>
                      <span
                        style={{
                          flex: 1,
                          color: "var(--text-color)",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </List.Item>
                )}
                size="small"
                split={false}
                locale={{ emptyText: "Không có bài viết hot" }}
              />
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1200px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          
          div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}