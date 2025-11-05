import React, { useState, useEffect } from "react";
import {
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  MenuOutlined,
  FireOutlined,
  FolderOutlined,
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

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      {/* ==== Hero Banner ==== */}
      <div
        className="position-relative overflow-hidden"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1499750310107-5fef28a666f8?q=80&w=2070') center/cover no-repeat",
          minHeight: "30vh",
          display: "flex",
          alignItems: "center",
          color: "white",
        }}
      >
        <div className="container py-5 text-center">
          <Title level={1} style={{ color: "white", fontSize: 48, fontWeight: 700 }}>
            Khám Phá Kiến Thức
          </Title>
          <Text style={{ color: "#f0f0f0", fontSize: 20 }}>
            Đọc, chia sẻ và học hỏi từ hàng nghìn bài viết chất lượng từ cộng đồng
          </Text>
          <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 mt-4">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm bài viết, chủ đề, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="large"
              className="rounded-pill"
              style={{
                maxWidth: "500px",
                background: "rgba(255,255,255,0.9)",
              }}
            />
            <Link to="/articles/create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                className="rounded-pill"
                style={{
                  fontWeight: 600,
                  background: "#ff4d4f",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(255,77,79,0.3)",
                }}
              >
                Viết bài mới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ==== Main Content ==== */}
      <div className="container-fluid py-5 px-5">
        <div className="row">
          {/* ==== Sidebar ==== */}
          <div className="col-lg-3 col-xl-3 d-none d-lg-block">
            <div
              className="card rounded-3 shadow-sm p-4 mb-4"
              style={{ position: "sticky", top: "20px" }}
            >
              <Title level={5} className="mb-3 d-flex align-items-center">
                <MenuOutlined className="me-2" /> Danh mục
              </Title>

              {loading ? (
                <Spin tip="Đang tải danh mục..." />
              ) : (
                <List
                  dataSource={[{ id: "", name: "Tất cả" }, ...categories]}
                  renderItem={(cat) => (
                    <List.Item
                      onClick={() => handleCategorySelect(cat.id)}
                      className="border-0 px-3 py-2 rounded-2 cursor-pointer"
                      style={{
                        background:
                          selectedCategory === cat.id ? "#e6f7ff" : "transparent",
                        transition: "all 0.3s",
                      }}
                    >
                      <Text
                        strong={selectedCategory === cat.id}
                        style={{
                          color:
                            selectedCategory === cat.id ? "#1890ff" : "#262626",
                        }}
                      >
                        {cat.name}
                      </Text>
                    </List.Item>
                  )}
                />
              )}
            </div>

            {/* ==== Hot Articles ==== */}
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
                        padding: "8px 0",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "translateX(5px)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "translateX(0)")
                      }
                    >
                      <Link
                        to={`/articles/${item.slug}`}
                        className="text-decoration-none w-100"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                      >
                        {/* Cột số thứ tự */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: "28px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#ff4d4f",
                          }}
                        >
                          {index + 1}.
                        </div>

                        {/* Cột tiêu đề */}
                        <div
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#1a1a1a",
                            fontWeight: 500,
                          }}
                        >
                          {item.title}
                        </div>
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
          <div className="col-lg-9 col-xl-9">
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
          <Title level={5} className="m-0">
            <MenuOutlined className="me-2" /> Danh mục
          </Title>
        }
        placement="left"
        onClose={toggleSidebar}
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
                className="border-0 px-3 py-2 rounded-2"
                style={{
                  background:
                    selectedCategory === cat.id ? "#e6f7ff" : "transparent",
                }}
              >
                <Text
                  strong={selectedCategory === cat.id}
                  style={{
                    color:
                      selectedCategory === cat.id ? "#1890ff" : "#262626",
                  }}
                >
                  {cat.name}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  );
}
