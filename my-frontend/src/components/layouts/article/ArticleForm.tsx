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
  InfoCircleOutlined,
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
        description: "Vui lòng đăng nhập để tạo bài viết!",
      });
      return;
    }

    if (!contentMarkdown.trim()) {
      notification.error({
        message: "Error",
        description: "Vui lòng nhập nội dung bài viết!",
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
        description: "Tạo bài viết thành công!",
      });
      form.resetFields();
      setContentMarkdown("");
      setThumbnail(null);
      setThumbnailPreview("");
      navigate("/articles");
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Có lỗi xảy ra khi tạo bài viết!",
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
        description: "Tag đã tồn tại!",
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
        description: "Không thể tạo tag mới!",
      });
    }
  };

  return (
    <div className="py-5">
      <div className="d-flex justify-content-center">
        <div className="col-lg-12 col-xl-11">
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
                    <FileTextOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>Tiêu đề bài viết</span>
                  </Space>
                }
                name="title"
                required={true}
                rules={[
                  { required: true, message: "Vui lòng nhập tiêu đề bài viết!" },
                ]}
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
                        <FolderOpenOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
                        <span style={{ fontWeight: 600, fontSize: "15px" }}>Chuyên mục</span>
                      </Space>
                    }
                    required={true}
                    name="categoryId"
                    rules={[
                      { required: true, message: "Vui lòng chọn chuyên mục!" },
                    ]}
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
                        <BarChartOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
                        <span style={{ fontWeight: 600, fontSize: "15px" }}>Độ khó</span>
                      </Space>
                    }
                    name="difficulty"
                  >
                    <Select size="large">
                      <Select.Option value="BEGINNER">Cơ bản</Select.Option>
                      <Select.Option value="INTERMEDIATE">
                        Trung bình
                      </Select.Option>
                      <Select.Option value="ADVANCED">Nâng cao</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* ✅ Tag selector */}
              <Form.Item
                label={
                  <Space>
                    <TagsOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>Thẻ Tag</span>
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

              {/* Markdown Editor - IMPROVED */}
              {/* Markdown Editor - IMPROVED */}
              <Form.Item
                name="contentMarkdown"
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>Nội dung bài viết</span>
                    <span
                      style={{
                        color: "#8c8c8c",
                        fontWeight: 400,
                        fontSize: "14px",
                      }}
                    >
                      (Hỗ trợ Markdown)
                    </span>
                  </Space>
                }
                tooltip={{
                  title:
                    "Sử dụng Markdown để định dạng nội dung. Hỗ trợ: **in đậm**, *in nghiêng*, # tiêu đề, - danh sách, [link](url), ![hình ảnh](url)",
                  icon: <InfoCircleOutlined style={{ color: "#1890ff", fontSize: "16px" }} />,
                }}
              >
                <div
                  data-color-mode="light"
                  className="border rounded overflow-hidden md-editor-custom"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <style>{`
                    .md-editor-custom .w-md-editor {
                      min-height: 800px !important;
                    }

                    .md-editor-custom .w-md-editor-content {
                      display: flex !important;
                      flex-direction: column !important;
                      height: 100% !important;
                    }

                    .md-editor-custom .w-md-editor-text-pre {
                      flex: 1 1 70% !important; /* 👈 chiếm 70% chiều cao */
                    }

                    .md-editor-custom .w-md-editor-preview {
                      flex: 1 1 30% !important; /* 👈 phần preview chiếm 30% còn lại */
                    }

                    .md-editor-custom .w-md-editor-text-pre > textarea {
                      height: 100% !important;
                      min-height: 500px !important;
                      padding: 16px !important;
                      font-size: 16px !important;
                      line-height: 1.8 !important;
                    }
                    .md-editor-custom .w-md-editor-toolbar {
                      height: 48px !important;
                      padding: 8px 12px !important;
                      background: #fafafa !important;
                    }
                    
                    .md-editor-custom .w-md-editor-toolbar button {
                      height: 32px !important;
                      width: 32px !important;
                      font-size: 18px !important;
                    }
                    
                    .md-editor-custom .w-md-editor-toolbar-divider {
                      height: 28px !important;
                      margin: 0 8px !important;
                    }
                    
                    .md-editor-custom .w-md-editor-toolbar ul > li {
                      margin: 0 3px !important;
                    }

                    .md-editor-custom .w-md-editor-text {
                      font-size: 15px !important;
                      line-height: 1.8 !important;
                    }

                    .md-editor-custom .wmde-markdown {
                      font-size: 15px !important;
                      line-height: 1.8 !important;
                    }
                  `}</style>
                  
                  <MDEditor
                    value={contentMarkdown}
                    onChange={(v) => setContentMarkdown(v || "")}
                    height={500}
                    preview="live"
                    textareaProps={{
                      placeholder: `# Tiêu đề bài viết

              ## Giới thiệu
              Viết phần giới thiệu ngắn gọn về chủ đề...

              ## Nội dung chính

              ### Phần 1: Mô tả
              - Điểm quan trọng thứ nhất
              - Điểm quan trọng thứ hai

              ### Phần 2: Chi tiết
              **Lưu ý:** Sử dụng **in đậm** để nhấn mạnh nội dung quan trọng.

              > Trích dẫn hoặc ghi chú đặc biệt

              \`\`\`javascript
              // Code example
              console.log("Hello World");
              \`\`\`

              ## Kết luận
              Tóm tắt những điểm chính...

              ---

              **Mẹo:** 
              - Sử dụng # ## ### cho tiêu đề
              - ** ** cho in đậm, * * cho in nghiêng
              - [Text](URL) để tạo link
              - ![Alt](URL) để chèn hình ảnh`,
                    }}
                    previewOptions={{
                      rehypePlugins: [],
                    }}
                  />
                </div>

                {/* Quick Guide */}
                <div
                  style={{
                    marginTop: "14px",
                    padding: "14px 18px",
                    background: "#f0f5ff",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#595959",
                  }}
                >
                  <Space direction="vertical" size={6} style={{ width: "100%" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1890ff",
                        marginBottom: "6px",
                        fontSize: "15px",
                      }}
                    >
                      📝 Hướng dẫn nhanh Markdown:
                    </div>
                    <Space wrap size={[18, 10]}>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>#</code> Tiêu đề
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>**text**</code> In đậm
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>*text*</code> In nghiêng
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>- item</code> Danh sách
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>[text](url)</code> Link
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>![alt](url)</code> Hình ảnh
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>`code`</code> Code
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <code style={{ fontSize: "13px", padding: "2px 6px" }}>&gt;</code> Trích dẫn
                      </span>
                    </Space>
                  </Space>
                </div>
              </Form.Item>

              {/* Thumbnail Upload */}
              <Form.Item
                label={
                  <Space>
                    <PictureOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>Ảnh thumbnail</span>
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
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
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