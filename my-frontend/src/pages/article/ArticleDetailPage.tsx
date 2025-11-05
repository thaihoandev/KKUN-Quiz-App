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

        // ✅ Kiểm tra tồn tại series trước khi gọi API
        if (article?.series && article.series.slug) {
          fetchSeriesArticles(article.series.slug);
        } else {
          // nếu không có series thì reset state liên quan
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

  // ✅ Lấy bài viết trong series
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

  // ✅ Lấy danh mục và bài viết sidebar
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

  // 🔄 Loading main article
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}
      >
        <Spin size="large" tip="Đang tải bài viết..." />
      </div>
    );
  }

  if (!currentArticle) {
    return (
      <div
        className="container py-5 text-center"
        style={{ backgroundColor: "#f5f7fa", minHeight: "100vh" }}
      >
        <Text type="danger">Bài viết không tồn tại hoặc đã bị xóa.</Text>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      <div className="container py-5">
        <div className="row">
          {/* Cột chính */}
          <div className="col-xl-9 col-lg-9">
            {currentArticle && <ArticleDetail article={currentArticle} />}
          </div>

          {/* Sidebar */}
          <div className="col-xl-3 col-lg-3">
            <div className="d-flex flex-column h-100">
              <div className="sticky-top" style={{ top: "20px" }}>
                {/* ✅ Bài viết trong series */}
                {seriesArticles.length > 0 && (
                  <Card
                    className="mb-4 shadow-sm"
                    title={
                      <Space>
                        <BookOutlined style={{ color: "#52c41a" }} />
                        <span>
                          Series: <strong>{seriesTitle}</strong>
                        </span>
                      </Space>
                    }
                    style={{
                      borderRadius: "12px",
                    }}
                    bodyStyle={{
                      paddingRight: "8px",
                      paddingTop: 0, // giảm khoảng cách giữa title và list
                    }}
                  >
                    {/* Bọc danh sách trong div scroll */}
                    <div
                      style={{
                        maxHeight: "300px", // 👈 Giới hạn chiều cao của list
                        overflowY: "auto", // 👈 Chỉ phần list scroll
                        paddingRight: "4px",
                      }}
                    >
                      <List
                        dataSource={seriesArticles}
                        renderItem={(item, index) => {
                          const isActive = item.id === currentArticle.id;
                          return (
                            <List.Item
                              style={{
                                padding: "10px 8px",
                                marginBottom: "6px",
                                borderRadius: "8px",
                                background: isActive ? "rgba(24,144,255,0.12)" : "transparent",
                                border: isActive ? "1px solid #1890ff" : "1px solid transparent",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <Link
                                to={`/articles/${item.slug}`}
                                className="w-100 text-decoration-none"
                              >
                                <Space className="w-100 align-items-start">
                                  <div style={{ flex: 1 }}>
                                    <Title
                                      level={5}
                                      style={{
                                        margin: 0,
                                        fontSize: "15px",
                                        lineHeight: "1.3",
                                        color: isActive ? "#1890ff" : "#1a1a1a",
                                        fontWeight: isActive ? 600 : 500,
                                      }}
                                    >
                                      {index + 1}. {item.title}
                                    </Title>
                                  </div>
                                </Space>
                              </Link>
                            </List.Item>
                          );
                        }}
                        size="small"
                        locale={{ emptyText: "Chưa có bài viết nào trong series" }}
                      />
                    </div>
                  </Card>
                )}
                {/* Cùng chuyên mục */}
                {currentArticle.category && (
                  <Card
                    className="mb-4 shadow-sm"
                    title={
                      <Space>
                        <FolderOutlined style={{ color: "#1890ff" }} />
                        <span>Bài viết cùng chuyên mục</span>
                      </Space>
                    }
                    style={{ borderRadius: "12px" }}
                    loading={sidebarLoading}
                  >
                    <List
                      dataSource={
                        categoriesWithArticles[0]?.articles.slice(0, 5) || []
                      }
                      renderItem={(item) => (
                        <List.Item
                          style={{
                            padding: "12px 0",
                            borderBottom: "1px solid #f0f0f0",
                            transition: "all 0.2s",
                          }}
                        >
                          <Link
                            to={`/articles/${item.slug}`}
                            className="w-100 text-decoration-none"
                          >
                            <Space className="w-100 justify-content-between align-items-start">
                              <div style={{ flex: 1 }}>
                                <Title
                                  level={5}
                                  style={{
                                    margin: 0,
                                    lineHeight: "1.3",
                                    color: "#1a1a1a",
                                    fontSize: "15px",
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
                                  }}
                                />
                              )}
                            </Space>
                          </Link>
                        </List.Item>
                      )}
                      size="small"
                      locale={{ emptyText: "Không có bài viết nào" }}
                    />
                  </Card>
                )}

                {/* Các chuyên mục khác */}
                <Card
                  className="mb-4 shadow-sm"
                  title={
                    <Space>
                      <FolderOutlined style={{ color: "#1890ff" }} />
                      <span>Các chuyên mục khác</span>
                    </Space>
                  }
                  style={{ borderRadius: "12px" }}
                  loading={sidebarLoading}
                >
                  <List
                    dataSource={categoriesWithArticles.slice(1)}
                    renderItem={(cat) => (
                      <List.Item
                        style={{
                          padding: "8px 0",
                          transition: "all 0.2s",
                        }}
                      >
                        <Link
                          to={`/articles/category/${cat.id}`}
                          className="d-flex justify-content-between align-items-center text-decoration-none"
                        >
                          <Space>
                            <Avatar
                              size={20}
                              style={{
                                backgroundColor: "#1890ff",
                                verticalAlign: "middle",
                              }}
                            >
                              {cat.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <span style={{ fontWeight: 500, color: "#1a1a1a" }}>
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
                    locale={{ emptyText: "Không có chuyên mục nào" }}
                  />
                </Card>

                {/* Bài viết hot */}
                <Card
                  className="shadow-sm"
                  title={
                    <Space>
                      <FireOutlined style={{ color: "#ff4d4f" }} />
                      <span>Bài viết hot</span>
                    </Space>
                  }
                  style={{ borderRadius: "12px" }}
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
                          padding: "10px 0",
                          transition: "all 0.2s",
                        }}
                      >
                        <Link
                          to={`/articles/${item.slug}`}
                          className="text-decoration-none"
                        >
                          <Space className="w-100">
                            <div style={{ width: "20px" }}>
                              <strong style={{ color: "#ff4d4f" }}>
                                {index + 1}
                              </strong>
                            </div>
                            <span
                              style={{
                                flex: 1,
                                marginLeft: "8px",
                                color: "#1a1a1a",
                              }}
                            >
                              {item.title}
                            </span>
                          </Space>
                        </Link>
                      </List.Item>
                    )}
                    size="small"
                    locale={{ emptyText: "Không có bài viết hot" }}
                  />
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
