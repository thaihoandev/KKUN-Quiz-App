import React, { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { getCategories } from "@/services/categoryService";
import { getTags, createTag } from "@/services/tagService";
import { createArticle } from "@/services/articleService";
import { ArticleCategoryDto } from "@/types/article";
import { notification } from "antd";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Typography,
  Space,
  Row,
  Col,
  Spin,
  Empty,
} from "antd";
import {
  FileTextOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  PictureOutlined,
  UploadOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface ArticleFormValues {
  title: string;
  categoryId: string;
  difficulty: string;
  tags: string[];
}

const ArticleForm: React.FC = () => {
  const [categories, setCategories] = useState<ArticleCategoryDto[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [form] = Form.useForm();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [contentMarkdown, setContentMarkdown] = useState<string>("");

  const { user, ensureMe } = useAuthStore();

    const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      setLoadingCategories(true);
      setLoadingTags(true);
      try {
        const [catRes, tagRes] = await Promise.all([
          getCategories(0, 20, "name,asc"),
          getTags(0, 20, "name,asc"),
        ]);
        setCategories(catRes.content);
        setTags(tagRes.content);
      } catch (err) {
        message.error("Không thể tải danh mục hoặc thẻ tag!");
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    fetchData();
    ensureMe();
  }, [ensureMe]);

  const handleThumbnailChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    setThumbnail(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: ArticleFormValues) => {
      if (!user || !user.userId) {
        notification.error({ 
            message: "Error", 
            description: "Vui lòng đăng nhập để tạo bài viết!" 
        });
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("contentMarkdown", contentMarkdown);
    formData.append("categoryId", values.categoryId);
    formData.append("difficulty", values.difficulty);
    formData.append("authorId", user.userId);

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    // ✅ Gửi từng tag riêng biệt để Spring Boot map thành List<String>
    if (values.tags && values.tags.length > 0) {
      values.tags.forEach((tag: string) => {
        formData.append("tags", tag);
      });
    }

    try {
      await createArticle(formData);
        notification.success({ 
            message: "Success", 
            description: "Tạo bài viết thành công!" 
        });
      form.resetFields();
      setContentMarkdown("");
      setThumbnail(null);
        setThumbnailPreview("");
        navigate("/articles");
    } catch (error) {
        notification.error({ 
            message: "Error", 
            description: "Có lỗi xảy ra khi tạo bài viết!" 
        });
    }
  };

  const handleTagCreate = async (newTagName: string) => {
    const existing = tags.find(
      (t) => t.name.toLowerCase() === newTagName.toLowerCase()
    );
    if (existing) {
      notification.warning({ 
            message: "Warning", 
            description: "Tag đã tồn tại!" 
        });
      return existing.id;
    }

    try {
      const newTag = await createTag(newTagName);
      if (newTag) {
        setTags((prev) => [...prev, newTag]);
        return newTag.id;
      }
    } catch {
      notification.error({ 
            message: "Error", 
            description: "Không thể tạo tag mới!" 
        });
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          {/* Header */}
          <div className="text-center mb-5">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-primary bg-gradient rounded-circle mb-3"
              style={{ width: "70px", height: "70px" }}
            >
              <FileTextOutlined style={{ fontSize: "32px", color: "white" }} />
            </div>
            <Title level={2} className="mb-2">
              Tạo bài viết mới
            </Title>
            <Text type="secondary" style={{ fontSize: "18px" }}>
              Chia sẻ kiến thức và kinh nghiệm của bạn với cộng đồng
            </Text>
          </div>

          {/* Form */}
          <Card className="shadow-lg border-0" style={{ borderRadius: "16px" }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ difficulty: "BEGINNER" }}
            >
              {/* Tiêu đề */}
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 600 }}>Tiêu đề bài viết</span>
                  </Space>
                }
                name="title"
                required={true}
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề bài viết!" }]}
              >
                <Input
                  size="large"
                  required={true}
                  placeholder="Nhập tiêu đề hấp dẫn cho bài viết của bạn..."
                  style={{ borderRadius: "8px" }}
                />
              </Form.Item>

              {/* Category - Difficulty */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <FolderOpenOutlined style={{ color: "#1890ff" }} />
                        <span style={{ fontWeight: 600 }}>Chuyên mục</span>
                      </Space>
                    }
                    required={true}
                    name="categoryId"
                    rules={[{ required: true, message: "Vui lòng chọn chuyên mục!" }]}
                  >
                    {loadingCategories ? (
                      <Spin tip="Đang tải chuyên mục..." />
                    ) : categories.length > 0 ? (
                      <Select size="large" placeholder="-- Chọn chuyên mục --">
                        {categories.map((c) => (
                          <Select.Option key={c.id} value={c.id}>
                            {c.name}
                          </Select.Option>
                        ))}
                      </Select>
                    ) : (
                      <Empty
                        description="Chưa có chuyên mục nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <BarChartOutlined style={{ color: "#1890ff" }} />
                        <span style={{ fontWeight: 600 }}>Độ khó</span>
                      </Space>
                    }
                    name="difficulty"
                  >
                    <Select size="large">
                      <Select.Option value="BEGINNER">Cơ bản</Select.Option>
                      <Select.Option value="INTERMEDIATE">Trung bình</Select.Option>
                      <Select.Option value="ADVANCED">Nâng cao</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* ✅ Tag selector */}
              <Form.Item
                label={
                  <Space>
                    <TagsOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 600 }}>Thẻ Tag</span>
                  </Space>
                }
                name="tags"
              >
                {loadingTags ? (
                  <Spin tip="Đang tải tag..." />
                ) : (
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Nhập hoặc chọn thẻ tag (vd: Java, Backend...)"
                    style={{ width: "100%" }}
                    onBlur={async (e) => {
                      const input = (e.target as HTMLInputElement).value.trim();
                      if (input) await handleTagCreate(input);
                    }}
                    showSearch
                  >
                    {tags.map((t) => (
                      <Select.Option key={t.name} value={t.name}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>

              {/* Markdown Editor */}
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 600 }}>Nội dung bài viết</span>
                  </Space>
                }
              >
                <div data-color-mode="light" className="border rounded overflow-hidden">
                  <MDEditor
                    value={contentMarkdown}
                    onChange={(v) => setContentMarkdown(v || "")}
                    height={450}
                    preview="live"
                  />
                </div>
              </Form.Item>

              {/* Thumbnail Upload */}
              <Form.Item
                label={
                  <Space>
                    <PictureOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 600 }}>Ảnh thumbnail</span>
                  </Space>
                }
              >
                <Row gutter={16} align="middle">
                  <Col xs={24} md={thumbnailPreview ? 16 : 24}>
                    <Upload
                      beforeUpload={() => false}
                      onChange={handleThumbnailChange}
                      maxCount={1}
                      accept="image/*"
                      listType="text"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        size="large"
                        style={{ width: "100%" }}
                      >
                        {thumbnail ? thumbnail.name : "Chọn ảnh thumbnail"}
                      </Button>
                    </Upload>
                    <Text
                      type="secondary"
                      className="d-block mt-2"
                      style={{ fontSize: "13px" }}
                    >
                      PNG, JPG, GIF tối đa 5MB
                    </Text>
                  </Col>

                  {thumbnailPreview && (
                    <Col xs={24} md={8}>
                      <div
                        className="border rounded overflow-hidden shadow-sm"
                        style={{ height: "150px" }}
                      >
                        <img
                          src={thumbnailPreview}
                          alt="Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    </Col>
                  )}
                </Row>
              </Form.Item>

              {/* Submit */}
              <Form.Item className="mb-0 mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{
                    width: "100%",
                    height: "50px",
                    fontSize: "16px",
                    fontWeight: 600,
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                    border: "none",
                  }}
                  disabled={!user}
                >
                  Xuất bản bài viết
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <div className="text-center mt-4">
            <Text type="secondary">
              Bài viết của bạn sẽ được xem xét trước khi hiển thị công khai
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleForm;
