import React, { useState, useEffect } from "react";
import {
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  MenuOutlined,
  FireOutlined,
  FolderOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import {
  Button,
  Typography,
  Input,
  Spin,
  Drawer,
  List,
  message,
  Card,
  Space,
  Tag,
} from "antd";
import { Link } from "react-router-dom";
import { getCategories } from "@/services/categoryArticleService";
import {
  getArticles,
  getArticlesByCategory,
} from "@/services/articleService";
import ArticleList from "@/components/layouts/article/ArticleList";
import { ArticleCategoryDto, ArticleDto } from "@/types/article";

const { Title, Text } = Typography;

interface CategoryWithArticles extends ArticleCategoryDto {
  articles: ArticleDto[];
}

export default function ArticlesPage() {
  const [categories, setCategories] = useState<ArticleCategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [categoriesWithArticles, setCategoriesWithArticles] = useState<CategoryWithArticles[]>([]);

  // ✅ Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await getCategories();
        setCategories(res.content);
      } catch (error) {
        message.error("Không thể tải danh mục!");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Fetch top bài viết hot theo từng danh mục
  useEffect(() => {
    const fetchSidebarArticles = async () => {
      setSidebarLoading(true);
      try {
        const res = await Promise.all(
          categories.map(async (cat) => {
            const result = await getArticlesByCategory(cat.id, 0, 3, "views,desc");
            return {
              ...cat,
              articles: result.content || [],
            };
          })
        );
        setCategoriesWithArticles(res);
      } catch (error) {
        message.error("Không thể tải bài viết hot!");
      } finally {
        setSidebarLoading(false);
      }
    };

    if (categories.length > 0) fetchSidebarArticles();
  }, [categories]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setSidebarVisible(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background-color)",
        color: "var(--text-color)",
        transition: "background-color 0.4s ease, color 0.4s ease",
      }}
    >
      {/* ==== Hero Banner ==== */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "35vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "3rem 1rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: "900px",
            width: "100%",
          }}
        >
          <Title
            level={1}
            style={{
              color: "white",
              fontSize: "3rem",
              fontWeight: 700,
              marginBottom: "1rem",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            Khám Phá Kiến Thức
          </Title>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "1.25rem",
              display: "block",
              marginBottom: "2rem",
            }}
          >
            Đọc, chia sẻ và học hỏi từ hàng nghìn bài viết chất lượng từ cộng đồng
          </Text>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm bài viết, chủ đề, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="large"
              style={{
                maxWidth: "500px",
                width: "100%",
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "50px",
                border: "none",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Link to="/articles/create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                style={{
                  borderRadius: "50px",
                  background: "linear-gradient(135deg, #ff6b6b, #ff5252)",
                  border: "none",
                  fontWeight: 600,
                  padding: "0.75rem 2rem",
                  boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 18px rgba(255, 107, 107, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(255, 107, 107, 0.3)";
                }}
              >
                Viết bài mới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ==== Main Content ==== */}
      <div
        style={{
          padding: "2rem 1rem",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* ==== Sidebar ==== */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              position: "sticky",
              top: "20px",
            }}
            className="d-none d-lg-flex"
          >
            {/* Categories Card */}
            <Card
              title={
                <Space>
                  <MenuOutlined style={{ fontSize: "1.1rem" }} />
                  <span style={{ fontWeight: 600 }}>Danh mục</span>
                </Space>
              }
              style={{
                borderRadius: "var(--border-radius)",
                boxShadow: "var(--card-shadow)",
                background: "var(--surface-color)",
                border: "none",
                overflow: "hidden",
              }}
            >

              {loading ? (
                <Spin tip="Đang tải danh mục..." />
              ) : (
                <List
                  dataSource={[{ id: "", name: "Tất cả" }, ...categories]}
                  renderItem={(cat) => (
                    <List.Item
                      onClick={() => handleCategorySelect(cat.id)}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        border: "2px solid var(--border-color)",
                        marginBottom: "0.5rem",
                        background:
                          selectedCategory === cat.id
                            ? "var(--gradient-primary)"
                            : "transparent",
                        color:
                          selectedCategory === cat.id
                            ? "white"
                            : "var(--text-color)",
                        borderColor:
                          selectedCategory === cat.id
                            ? "transparent"
                            : "var(--border-color)",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== cat.id) {
                          e.currentTarget.style.background = "var(--surface-alt)";
                          e.currentTarget.style.borderColor = "var(--primary-color)";
                        }
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== cat.id) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor = "var(--border-color)";
                        }
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <FolderOutlined style={{ marginRight: "0.5rem" }} />
                      <Text
                        strong={selectedCategory === cat.id}
                        style={{
                          color: "inherit",
                          fontWeight:
                            selectedCategory === cat.id ? 600 : 500,
                        }}
                      >
                        {cat.name}
                      </Text>
                    </List.Item>
                  )}
                  split={false}
                />
              )}
            </Card>

            {/* Hot Articles Card */}
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: "#ff4d4f" }} />
                  <span>Bài viết hot</span>
                </Space>
              }
              style={{
                borderRadius: "var(--border-radius)",
                boxShadow: "var(--card-shadow)",
                background: "var(--surface-color)",
                border: "none",
                overflow: "hidden",
              }}
              loading={sidebarLoading}
            >
              {sidebarLoading ? (
                <Spin />
              ) : (
                <List
                  dataSource={categoriesWithArticles
                    .flatMap((c) => c.articles)
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 5)}
                  renderItem={(item, index) => (
                    <List.Item
                      style={{
                        padding: "0.75rem 0",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <Link
                        to={`/articles/${item.slug}`}
                        style={{
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        {/* Index */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            background: "var(--gradient-primary)",
                            color: "white",
                            borderRadius: "50%",
                            fontSize: "0.85rem",
                          }}
                        >
                          {index + 1}
                        </div>

                        {/* Title */}
                        <div
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--text-color)",
                            fontWeight: 500,
                            fontSize: "0.9rem",
                          }}
                        >
                          {item.title}
                        </div>

                        {/* Views */}
                        <Tag
                          color="blue"
                          style={{
                            flexShrink: 0,
                            fontSize: "0.75rem",
                          }}
                        >
                          {item.views}
                        </Tag>
                      </Link>
                    </List.Item>
                  )}
                  size="small"
                  locale={{ emptyText: "Không có bài viết hot" }}
                />
              )}
            </Card>
          </div>

          {/* ==== Article List ==== */}
          <div style={{ width: "100%" }}>
            <ArticleList
              categoryId={selectedCategory}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* ==== Mobile Drawer ==== */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MenuOutlined />
            <span>Danh mục</span>
          </div>
        }
        placement="left"
        onClose={() => setSidebarVisible(false)}
        open={sidebarVisible}
        width={280}
      >
        {loading ? (
          <Spin tip="Đang tải..." />
        ) : (
          <List
            dataSource={[{ id: "", name: "Tất cả" }, ...categories]}
            renderItem={(cat) => (
              <List.Item
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background:
                    selectedCategory === cat.id
                      ? "var(--gradient-primary)"
                      : "transparent",
                  color:
                    selectedCategory === cat.id
                      ? "white"
                      : "var(--text-color)",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  marginBottom: "0.5rem",
                }}
              >
                <Text
                  strong={selectedCategory === cat.id}
                  style={{
                    color: "inherit",
                    fontWeight: selectedCategory === cat.id ? 600 : 500,
                  }}
                >
                  {cat.name}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Drawer>

      {/* Mobile Menu Button */}
      <Button
        icon={<MenuOutlined />}
        onClick={() => setSidebarVisible(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "1rem",
          zIndex: 999,
          display: "none",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--gradient-primary)",
          border: "none",
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontSize: "1.5rem",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
        className="d-lg-none"
      />

      {/* Remove darkMode state declaration if not needed elsewhere */}

      <style>{`
        @media (max-width: 1024px) {
          [class*="d-lg-flex"] {
            display: none !important;
          }
          
          [class*="d-lg-none"] {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}