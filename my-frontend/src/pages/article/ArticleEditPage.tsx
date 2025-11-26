// src/pages/articles/ArticleEditPage.tsx
import React, { useEffect, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { useParams, useNavigate } from "react-router-dom";
import { getArticleBySlug, updateArticle } from "@/services/articleService";
import { getTags, createTag } from "@/services/tagService";
import { getSeriesList } from "@/services/seriesService";
import { getCategories } from "@/services/categoryArticleService";
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
  UploadOutlined,
  TagsOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/store/authStore";

const { Title } = Typography;

/** Đọc theme từ localStorage & các key phổ biến */
function resolveModeFromLocalStorage(): "light" | "dark" {
  try {
    const keys = ["theme", "color-theme", "app-theme", "mode"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const v = String(raw).toLowerCase().trim();
      if (v.includes("dark") || v === "1" || v === "true" || v === "enabled") return "dark";
      if (v.includes("light") || v === "0" || v === "false" || v === "disabled") return "light";
    }
  } catch {}
  return document.documentElement.classList.contains("dark-mode") ? "dark" : "light";
}

const ArticleEditPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // CHỈ LẤY NHỮNG GÌ CẦN – không subscribe toàn bộ user object
  const userId = useAuthStore((state) => state.user?.userId);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ArticleCategoryDto[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [series, setSeries] = useState<{ id: string; title: string }[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [contentMarkdown, setContentMarkdown] = useState<string>("");

  // Theme cho MDEditor – đồng bộ realtime
  const [mdColorMode, setMdColorMode] = useState<"light" | "dark">(() => resolveModeFromLocalStorage());

  // Đồng bộ theme khi đổi (cùng tab hoặc tab khác)
  useEffect(() => {
    const apply = () => setMdColorMode(resolveModeFromLocalStorage());

    const onStorage = (e: StorageEvent) => {
      if (e.key && ["theme", "color-theme", "app-theme", "mode"].includes(e.key)) apply();
    };

    const onThemeChange = (e: CustomEvent) => {
      if (e.detail?.mode === "dark" || e.detail?.mode === "light") {
        setMdColorMode(e.detail.mode);
      } else {
        apply();
      }
    };

    window.addEventListener("storage", onStorage as EventListener);
    window.addEventListener("theme-change", onThemeChange as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage as EventListener);
      window.removeEventListener("theme-change", onThemeChange as EventListener);
    };
  }, []);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (accessToken === null) {
      notification.warning({ message: "Vui lòng đăng nhập để chỉnh sửa bài viết!" });
      navigate("/login");
    }
  }, [accessToken, navigate]);

  // Load dữ liệu bài viết + danh mục (chỉ chạy khi slug hoặc userId thay đổi)
  useEffect(() => {
    if (!slug || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [articleRes, catRes, tagRes, seriesRes] = await Promise.all([
          getArticleBySlug(slug),
          getCategories(0, 100, "name,asc"),
          getTags(0, 100, "name,asc"),
          getSeriesList(0, 100, "createdAt,desc"),
        ]);

        const article = articleRes;
        if (!article) {
          notification.error({ message: "Bài viết không tồn tại hoặc đã bị xóa!" });
          navigate("/articles");
          return;
        }

        // Kiểm tra quyền sở hữu
        if (userId !== article.authorId) {
          notification.error({
            message: "Không có quyền!",
            description: "Bạn chỉ có thể chỉnh sửa bài viết của chính mình.",
          });
          navigate(`/articles/${slug}`);
          return;
        }

        // Cập nhật form + state
        form.setFieldsValue({
          title: article.title,
          categoryId: article.category?.id || undefined,
          difficulty: article.difficulty || undefined,
          tags: article.tags?.map((t: any) => t.name) || [],
          seriesId: article.series?.id || undefined,
        });

        setContentMarkdown(article.contentMarkdown || "");
        setThumbnailPreview(article.thumbnailUrl || "");

        setCategories(catRes.content);
        setTags(tagRes.content);
        setSeries(seriesRes.content);
      } catch (err: any) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: err.message || "Không thể tải thông tin bài viết!",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, userId, form, navigate]); // Không còn user object → không re-run khi refreshMe()

  // Xử lý upload thumbnail
  const handleThumbnailChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (!file) return;

    setThumbnail(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Tạo tag mới
  const handleTagCreate = async (newTagName: string) => {
    if (!newTagName.trim()) return;

    const normalized = newTagName.trim().toLowerCase();
    const existing = tags.find((t) => t.name.toLowerCase() === normalized);
    if (existing) return existing.id;

    try {
      const newTag = await createTag(newTagName.trim());
      if (newTag) {
        setTags((prev) => [...prev, newTag]);
        return newTag.id;
      }
    } catch {
      notification.error({ message: "Không thể tạo tag mới!" });
    }
  };

  // Submit form
  const handleSubmit = async (values: any) => {
    if (!userId || !slug) return;

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("contentMarkdown", contentMarkdown || "");
    formData.append("categoryId", values.categoryId);
    formData.append("authorId", userId);

    if (values.difficulty) formData.append("difficulty", values.difficulty);
    if (values.seriesId) formData.append("seriesId", values.seriesId);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    values.tags?.forEach((tag: string) => {
      if (tag.trim()) formData.append("tags", tag.trim());
    });

    try {
      setLoading(true);
      await updateArticle(slug, formData);
      notification.success({
        message: "Thành công!",
        description: "Bài viết đã được cập nhật.",
      });
      navigate(`/articles/${slug}`);
    } catch {
      notification.error({
        message: "Cập nhật thất bại",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin fullscreen tip="Đang tải dữ liệu bài viết..." />;
  }

  return (
    <div className="py-5 max-w-6xl mx-auto px-4">
      <div className="text-center mb-8">
        <div
          className="d-inline-flex align-items-center justify-content-center bg-primary bg-gradient rounded-circle mb-4"
          style={{ width: 80, height: 80 }}
        >
          <FileTextOutlined style={{ fontSize: 40, color: "white" }} />
        </div>
        <Title level={2}>Chỉnh sửa bài viết</Title>
      </div>

      <Card className="shadow-xl border-0" style={{ borderRadius: 20 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Tiêu đề */}
          <Form.Item
            name="title"
            label={<Label icon={<FileTextOutlined />} text="Tiêu đề" />}
            rules={[{ required: true, message: "Hãy nhập tiêu đề bài viết!" }]}
          >
            <Input size="large" placeholder="Nhập tiêu đề hấp dẫn..." />
          </Form.Item>

          {/* Chuyên mục, độ khó, series */}
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="categoryId"
                label={<Label icon={<FolderOpenOutlined />} text="Chuyên mục" />}
                rules={[{ required: true, message: "Chọn chuyên mục!" }]}
              >
                <Select size="large" placeholder="Chọn chuyên mục" options={categories.map(c => ({ label: c.name, value: c.id }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="difficulty" label={<Label icon={<BarChartOutlined />} text="Độ khó" />}>
                <Select allowClear size="large" placeholder="Chọn độ khó">
                  <Select.Option value="BEGINNER">Cơ bản</Select.Option>
                  <Select.Option value="INTERMEDIATE">Trung bình</Select.Option>
                  <Select.Option value="ADVANCED">Nâng cao</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="seriesId" label={<Label icon={<ReadOutlined />} text="Series" />}>
                <Select allowClear size="large" placeholder="Gắn vào series (tuỳ chọn)">
                  {series.map(s => (
                    <Select.Option key={s.id} value={s.id}>{s.title}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Tags */}
          <Form.Item name="tags" label={<Label icon={<TagsOutlined />} text="Tags" />}>
            <Select
              mode="tags"
              size="large"
              placeholder="Nhập tag mới hoặc chọn tag có sẵn..."
              options={tags.map(t => ({ label: t.name, value: t.name }))}
            />
          </Form.Item>

          {/* Nội dung Markdown */}
          <Form.Item label="Nội dung bài viết">
            <div data-color-mode={mdColorMode} key={`md-wrapper-${mdColorMode}`}>
              <MDEditor
                value={contentMarkdown}
                onChange={(v) => setContentMarkdown(v || "")}
                height={600}
                preview="live"
                data-color-mode={mdColorMode}
              />
            </div>
          </Form.Item>

          {/* Thumbnail */}
          <Form.Item label="Ảnh thumbnail">
            <Row gutter={16} align="middle">
              <Col xs={24} md={thumbnailPreview ? 16 : 24}>
                <Upload beforeUpload={() => false} onChange={handleThumbnailChange} maxCount={1} showUploadList={false}>
                  <Button icon={<UploadOutlined />} size="large" block>
                    {thumbnail ? thumbnail.name : "Chọn ảnh thumbnail (tuỳ chọn)"}
                  </Button>
                </Upload>
              </Col>
              {thumbnailPreview && (
                <Col xs={24} md={8}>
                  <img src={thumbnailPreview} alt="Preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }} />
                </Col>
              )}
            </Row>
          </Form.Item>

          {/* Nút submit */}
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" size="large" block style={{ height: 56, fontSize: 18, borderRadius: 12 }}>
              Cập nhật bài viết
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

// Helper nhỏ cho label đẹp
const Label: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <Space>
    {React.cloneElement(icon as React.ReactElement)}
    <span style={{ fontWeight: 600 }}>{text}</span>
  </Space>
);

export default ArticleEditPage;