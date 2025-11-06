import React, { useEffect, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { useParams, useNavigate } from "react-router-dom";
import {
  getArticleBySlug,
  updateArticle,
} from "@/services/articleService";
import { getTags, createTag } from "@/services/tagService";
import { getSeriesList } from "@/services/seriesService";
import { ArticleCategoryDto } from "@/types/article";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Upload,
  Typography,
  Space,
  Row,
  Col,
  Spin,
  notification,
} from "antd";
import {
  FileTextOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  PictureOutlined,
  UploadOutlined,
  TagsOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/store/authStore";
import { getCategories } from "@/services/categoryArticleService";

const { Title, Text } = Typography;

const ArticleEditPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ArticleCategoryDto[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [series, setSeries] = useState<{ id: string; title: string }[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [contentMarkdown, setContentMarkdown] = useState<string>("");

  // 🧩 Load dữ liệu bài viết + các list cơ bản
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [article, catRes, tagRes, seriesRes] = await Promise.all([
          getArticleBySlug(slug),
          getCategories(0, 50, "name,asc"),
          getTags(0, 50, "name,asc"),
          getSeriesList(0, 50, "createdAt,desc"),
        ]);

        if (!article) {
          notification.error({ message: "Bài viết không tồn tại!" });
          navigate("/articles");
          return;
        }

        // ⚠️ Kiểm tra quyền (frontend-level)
        if (user && user.userId !== article.authorId) {
          notification.error({
            message: "Không có quyền chỉnh sửa",
            description: "Bạn không phải tác giả của bài viết này.",
          });
          navigate(`/articles/${slug}`);
          return;
        }

        setCategories(catRes.content);
        setTags(tagRes.content);
        setSeries(seriesRes.content);

        // ✅ Gán dữ liệu vào form
        form.setFieldsValue({
          title: article.title,
          categoryId: article.category?.id,
          difficulty: article.difficulty,
          tags: article.tags?.map((t: any) => t.name),
          seriesId: article.series?.id,
        });

        setContentMarkdown(article.contentMarkdown || "");
        setThumbnailPreview(article.thumbnailUrl || "");
      } catch (err) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: "Không thể tải thông tin bài viết hoặc danh mục!",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, form, navigate, user]);

  // ✅ Upload ảnh
  const handleThumbnailChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    setThumbnail(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ✅ Tạo tag mới
  const handleTagCreate = async (newTagName: string) => {
    const existing = tags.find(
      (t) => t.name.toLowerCase() === newTagName.toLowerCase()
    );
    if (existing) return existing.id;

    try {
      const newTag = await createTag(newTagName);
      if (newTag) {
        setTags((prev) => [...prev, newTag]);
        return newTag.id;
      }
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Không thể tạo tag mới!",
      });
    }
  };

  // ✅ Submit cập nhật
  const handleSubmit = async (values: any) => {
    if (!user?.userId || !slug) {
      notification.error({
        message: "Lỗi",
        description: "Không xác định người dùng hoặc bài viết!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("contentMarkdown", contentMarkdown);
    formData.append("categoryId", values.categoryId);
    formData.append("authorId", user.userId);

    if (values.difficulty) formData.append("difficulty", values.difficulty);
    if (values.seriesId) formData.append("seriesId", values.seriesId);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    if (values.tags?.length > 0)
      values.tags.forEach((tag: string) => formData.append("tags", tag));

    try {
      const updated = await updateArticle(slug, formData);
      if (updated) {
        notification.success({
          message: "Thành công",
          description: "Bài viết đã được cập nhật!",
        });
        navigate(`/articles/${slug}`);
      }
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Không thể cập nhật bài viết!",
      });
    }
  };

  if (loading) return <Spin fullscreen tip="Đang tải dữ liệu..." />;

  return (
    <div className="py-5">
      <div className="text-center mb-5">
        <div
          className="d-inline-flex align-items-center justify-content-center bg-primary bg-gradient rounded-circle mb-3"
          style={{ width: "70px", height: "70px" }}
        >
          <FileTextOutlined style={{ fontSize: "32px", color: "white" }} />
        </div>
        <Title level={2}>Chỉnh sửa bài viết</Title>
      </div>

      <Card className="shadow-lg border-0" style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Tiêu đề */}
          <Form.Item
            name="title"
            label={
              <Space>
                <FileTextOutlined style={{ color: "#1890ff" }} />
                <span style={{ fontWeight: 600 }}>Tiêu đề</span>
              </Space>
            }
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input size="large" placeholder="Nhập tiêu đề..." />
          </Form.Item>

          {/* Category + Difficulty + Series */}
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="categoryId"
                label={
                  <Space>
                    <FolderOpenOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 600 }}>Chuyên mục</span>
                  </Space>
                }
                rules={[{ required: true, message: "Vui lòng chọn chuyên mục!" }]}
              >
                <Select
                  size="large"
                  placeholder="-- Chọn chuyên mục --"
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="difficulty"
                label={
                  <Space>
                    <BarChartOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 600 }}>Độ khó</span>
                  </Space>
                }
              >
                <Select
                  allowClear
                  size="large"
                  placeholder="-- Độ khó --"
                  options={[
                    { label: "Cơ bản", value: "BEGINNER" },
                    { label: "Trung bình", value: "INTERMEDIATE" },
                    { label: "Nâng cao", value: "ADVANCED" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="seriesId"
                label={
                  <Space>
                    <ReadOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 600 }}>Series</span>
                  </Space>
                }
              >
                <Select
                  allowClear
                  size="large"
                  placeholder="-- Gắn vào series --"
                  options={series.map((s) => ({ label: s.title, value: s.id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Tags */}
          <Form.Item
            name="tags"
            label={
              <Space>
                <TagsOutlined style={{ color: "#1890ff" }} />
                <span style={{ fontWeight: 600 }}>Tag</span>
              </Space>
            }
          >
            <Select
              mode="tags"
              size="large"
              placeholder="Nhập hoặc chọn tag..."
              onBlur={async (e) => {
                const input = (e.target as HTMLInputElement).value.trim();
                if (input) await handleTagCreate(input);
              }}
              options={tags.map((t) => ({ label: t.name, value: t.name }))}
            />
          </Form.Item>

          {/* Markdown */}
          <Form.Item label="Nội dung bài viết">
            <MDEditor
              value={contentMarkdown}
              onChange={(v) => setContentMarkdown(v || "")}
              height={500}
              preview="live"
              data-color-mode="light"
            />
          </Form.Item>

          {/* Thumbnail */}
          <Form.Item label="Ảnh thumbnail">
            <Row gutter={16}>
              <Col xs={24} md={thumbnailPreview ? 16 : 24}>
                <Upload
                  beforeUpload={() => false}
                  onChange={handleThumbnailChange}
                  maxCount={1}
                  accept="image/*"
                  listType="text"
                >
                  <Button icon={<UploadOutlined />} size="large" block>
                    {thumbnail ? thumbnail.name : "Chọn ảnh mới (tuỳ chọn)"}
                  </Button>
                </Upload>
              </Col>
              {thumbnailPreview && (
                <Col xs={24} md={8}>
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </Col>
              )}
            </Row>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{ width: "100%", borderRadius: 12 }}
            >
              Cập nhật bài viết
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ArticleEditPage;
