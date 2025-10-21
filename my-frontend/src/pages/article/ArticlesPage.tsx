import React, { useState, useEffect } from "react";
import { FileTextOutlined, PlusOutlined, SearchOutlined, MenuOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Typography, Input, Spin, Drawer, List, message } from "antd";
import { Link } from "react-router-dom";
import { getCategories } from "@/services/categoryService";
import ArticleList from "@/components/layouts/article/ArticleList";
import "bootstrap/dist/css/bootstrap.min.css";

const { Title, Text } = Typography;

export default function ArticlesPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await getCategories();
        setCategories(res.content);
      } catch (error) {
        console.error("Error fetching categories:", error);
        message.error("Không thể tải danh mục!");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setSidebarVisible(false); // Close sidebar on mobile after selection
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f5f7fa" }}>
      {/* Hero Section */}
      <div
        className="bg-white shadow-lg py-5 animate__animated animate__fadeIn"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f0f2f5 100%)",
        }}
      >
        <div className="container text-center">
          <div
            className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
            style={{ width: "80px", height: "80px" }}
          >
            <FileTextOutlined style={{ fontSize: "40px", color: "white" }} />
          </div>
          <Title level={1} className="mb-3 fw-bold" style={{ color: "#1a1a1a", fontSize: "36px" }}>
            Khám phá kiến thức
          </Title>
          <Text type="secondary" className="mb-4 d-block" style={{ fontSize: "18px" }}>
            Tìm kiếm và đọc các bài viết hữu ích từ cộng đồng của chúng tôi
          </Text>
          <div className="d-flex justify-content-center align-items-center gap-3 flex-column flex-md-row">
            <Input
              prefix={<SearchOutlined className="text-muted" />}
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="large"
              className="rounded-3"
              style={{ maxWidth: "400px", width: "100%" }}
            />
            <Link to="/articles/create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                style={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  border: "none",
                  transition: "all 0.3s ease",
                }}
                className="btn btn-primary"
              >
                Tạo bài viết
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container-fluid py-5">
        <div className="row">
          {/* Sidebar (Category Column) */}
          <div className="col-md-2 d-none d-md-block">
            <div className="bg-white shadow-sm rounded-3 p-4" style={{ position: "sticky", top: "20px" }}>
              <Title level={4} className="mb-4 fw-bold" style={{ color: "#1a1a1a" }}>
                Danh mục
              </Title>
              {loading ? (
                <Spin tip="Đang tải danh mục..." />
              ) : (
                <List
                  dataSource={[{ id: "", name: "Tất cả" }, ...categories]}
                  renderItem={(category) => (
                    <List.Item
                      onClick={() => handleCategorySelect(category.id)}
                      className="border-0 px-2 py-1 cursor-pointer animate__animated animate__fadeIn"
                      style={{
                        background: selectedCategory === category.id ? "#e6f7ff" : "transparent",
                        borderRadius: "8px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.background = "#f5f7fa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <RightOutlined
                          style={{
                            fontSize: "12px",
                            color: selectedCategory === category.id ? "#1890ff" : "#8c8c8c",
                            marginRight: "12px",
                          }}
                        />
                        <Text
                          style={{
                            fontSize: "16px",
                            fontWeight: selectedCategory === category.id ? 600 : 400,
                            color: selectedCategory === category.id ? "#1890ff" : "#1a1a1a",
                          }}
                        >
                          {category.name}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>

          {/* Article List */}
          <div className="col-md-10">
            <ArticleList categoryId={selectedCategory} searchQuery={searchQuery} />
          </div>

          {/* Mobile Sidebar (Drawer) */}
          <Drawer
            title="Danh mục"
            placement="left"
            onClose={toggleSidebar}
            open={sidebarVisible}
            width={250}
            headerStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px" }}
          >
            {loading ? (
              <Spin tip="Đang tải danh mục..." />
            ) : (
              <List
                dataSource={[{ id: "", name: "Tất cả" }, ...categories]}
                renderItem={(category) => (
                  <List.Item
                    onClick={() => handleCategorySelect(category.id)}
                    className="border-0 px-2 py-1 cursor-pointer"
                    style={{
                      background: selectedCategory === category.id ? "#e6f7ff" : "transparent",
                      borderRadius: "8px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <RightOutlined
                        style={{
                          fontSize: "12px",
                          color: selectedCategory === category.id ? "#1890ff" : "#8c8c8c",
                          marginRight: "12px",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: "16px",
                          fontWeight: selectedCategory === category.id ? 600 : 400,
                          color: selectedCategory === category.id ? "#1890ff" : "#1a1a1a",
                        }}
                      >
                        {category.name}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Drawer>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <Button
        icon={<MenuOutlined />}
        size="large"
        className="d-md-none position-fixed bottom-0 end-0 m-4 rounded-circle shadow"
        style={{
          zIndex: 1000,
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "white",
          border: "none",
        }}
        onClick={toggleSidebar}
      />
    </div>
  );
}