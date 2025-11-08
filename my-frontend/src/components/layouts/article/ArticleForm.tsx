// src/pages/articles/ArticleCreatePage.tsx (hoặc ArticleForm.tsx)
import React, { useEffect, useMemo, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { getCategories } from "@/services/categoryArticleService";
import { getTags, createTag } from "@/services/tagService";
import { getSeriesByAuthor } from "@/services/seriesService";
import { createArticle } from "@/services/articleService";
import { ArticleCategoryDto } from "@/types/article";
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
import { useNavigate, useSearchParams } from "react-router-dom";

const { Title, Text } = Typography;

interface ArticleFormValues {
  title: string;
  categoryId: string;
  difficulty?: string;
  tags: string[];
  seriesId?: string;
}

/** Đọc mode từ localStorage (đa key) */
function resolveModeFromLocalStorage(): "light" | "dark" {
  try {
    const keys = ["theme", "color-theme", "app-theme", "mode"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const v = String(raw).toLowerCase().trim();
      if (v.includes("dark")) return "dark";
      if (v.includes("light")) return "light";
      if (v === "1" || v === "true" || v === "darkmode" || v === "enabled") return "dark";
      if (v === "0" || v === "false" || v === "disabled") return "light";
    }
  } catch {}
  if (document.documentElement.classList.contains("dark-mode")) return "dark";
  return "light";
}

const ArticleForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const seriesIdFromParams = searchParams.get("seriesId");

  const [categories, setCategories] = useState<ArticleCategoryDto[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [series, setSeries] = useState<{ id: string; title: string }[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);

  const [form] = Form.useForm();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [contentMarkdown, setContentMarkdown] = useState<string>("");

  const { user, ensureMe } = useAuthStore();
  const navigate = useNavigate();

  /** Theme cho MDEditor */
  const [mdColorMode, setMdColorMode] = useState<"light" | "dark">(
    () => resolveModeFromLocalStorage()
  );
  const [mounted, setMounted] = useState(true);

  // Khi mode đổi: set attribute lên <html> + remount editor
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", mdColorMode);
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, [mdColorMode]);

  // Lắng nghe đổi theme từ tab khác / cùng tab
  useEffect(() => {
    const apply = () => setMdColorMode(resolveModeFromLocalStorage());

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (["theme", "color-theme", "app-theme", "mode"].includes(e.key)) apply();
    };
    window.addEventListener("storage", onStorage);

    // Ở nơi toggle, nhớ dispatch:
    // window.dispatchEvent(new CustomEvent('theme-change', { detail: { mode: 'dark'|'light' } }))
    const onThemeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.mode === "dark" || detail?.mode === "light") {
        setMdColorMode(detail.mode);
      } else {
        apply();
      }
    };
    window.addEventListener("theme-change", onThemeChange as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theme-change", onThemeChange as EventListener);
    };
  }, []);

  // 🧩 Tải categories, tags, series (theo author nếu có)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingTags(true);
        setLoadingSeries(true);

        const [catRes, tagRes, seriesRes] = await Promise.all([
          getCategories(0, 50, "name,asc"),
          getTags(0, 50, "name,asc"),
          user?.userId ? getSeriesByAuthor(String(user.userId), 0, 20, "createdAt,desc") : Promise.resolve({ content: [] }),
        ]);

        setCategories(catRes.content);
        setTags(tagRes.content);
        setSeries(seriesRes.content ?? []);

        // ✅ Nếu có seriesId từ params, tự động set
        if (seriesIdFromParams) {
          form.setFieldValue("seriesId", seriesIdFromParams);
        }
      } catch {
        message.error("Không thể tải danh mục, tag hoặc series!");
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
        setLoadingSeries(false);
      }
    };

    ensureMe();
    fetchData();
  }, [ensureMe, form, seriesIdFromParams, user?.userId]);

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

  // ✅ Submit form
  const handleSubmit = async (values: ArticleFormValues) => {
    if (!user?.userId) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng đăng nhập để tạo bài viết!",
      });
      return;
    }

    if (!contentMarkdown.trim()) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập nội dung bài viết!",
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
    if (values.tags?.length > 0) values.tags.forEach((tag) => formData.append("tags", tag));

    try {
      await createArticle(formData);
      notification.success({
        message: "Thành công",
        description: "Tạo bài viết thành công!",
      });
      form.resetFields();
      setContentMarkdown("");
      setThumbnail(null);
      setThumbnailPreview("");

      // ✅ Quay về series page nếu có, không thì về articles
      if (seriesIdFromParams) {
        const selectedSeries = series.find((s) => s.id === seriesIdFromParams);
        if (selectedSeries) navigate(`/series/${selectedSeries.id}`);
        else navigate("/articles");
      } else {
        navigate("/articles");
      }
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Không thể tạo bài viết!",
      });
    }
  };

  // ✅ Tạo tag mới
  const handleTagCreate = async (newTagName: string) => {
    const existing = tags.find(
      (t) => t.name.toLowerCase() === newTagName.toLowerCase()
    );
    if (existing) {
      notification.warning({
        message: "Cảnh báo",
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
        message: "Lỗi",
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
              style={{ width: 70, height: 70 }}
            >
              <FileTextOutlined style={{ fontSize: 32, color: "#fff" }} />
            </div>
            <Title level={2} className="mb-1">Tạo bài viết mới</Title>
            <Text type="secondary">
              Điền thông tin cơ bản, gắn thẻ và soạn nội dung bằng Markdown.
            </Text>
          </div>

          <Card className="shadow-lg border-0" style={{ borderRadius: 16 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ difficulty: undefined }}
            >
              {/* Tiêu đề */}
              <Form.Item
                name="title"
                label={
                  <Space>
                    <FileTextOutlined />
                    <strong>Tiêu đề bài viết</strong>
                  </Space>
                }
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
              >
                <Input size="large" placeholder="Nhập tiêu đề hấp dẫn cho bài viết..." />
              </Form.Item>

              {/* Category - Difficulty - Series */}
              <Row gutter={16}>
                {/* 🟢 Category */}
                <Col xs={24} md={8}>
                  <Form.Item
                    name="categoryId"
                    label={
                      <Space>
                        <FolderOpenOutlined />
                        <strong>Chuyên mục</strong>
                      </Space>
                    }
                    rules={[{ required: true, message: "Vui lòng chọn chuyên mục!" }]}
                  >
                    {loadingCategories ? (
                      <Spin />
                    ) : (
                      <Select
                        showSearch
                        allowClear
                        size="large"
                        placeholder="-- Chọn hoặc tìm chuyên mục --"
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toString()
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={categories.map((c) => ({ label: c.name, value: c.id }))}
                      />
                    )}
                  </Form.Item>
                </Col>

                {/* 🟠 Difficulty */}
                <Col xs={24} md={8}>
                  <Form.Item
                    name="difficulty"
                    label={
                      <Space>
                        <BarChartOutlined />
                        <strong>Độ khó</strong>
                        <Text type="secondary">(tuỳ chọn)</Text>
                      </Space>
                    }
                  >
                    <Select
                      showSearch
                      allowClear
                      size="large"
                      placeholder="-- Chọn hoặc tìm độ khó --"
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toString()
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={[
                        { label: "Cơ bản", value: "BEGINNER" },
                        { label: "Trung bình", value: "INTERMEDIATE" },
                        { label: "Nâng cao", value: "ADVANCED" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                {/* 🔵 Series */}
                <Col xs={24} md={8}>
                  <Form.Item
                    name="seriesId"
                    label={
                      <Space>
                        <ReadOutlined />
                        <strong>Series</strong>
                        <Text type="secondary">(nếu có)</Text>
                      </Space>
                    }
                  >
                    {loadingSeries ? (
                      <Spin />
                    ) : series.length > 0 ? (
                      <Select
                        showSearch
                        allowClear
                        size="large"
                        placeholder="-- Chọn hoặc tìm series --"
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toString()
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={series.map((s) => ({ label: s.title, value: s.id }))}
                      />
                    ) : (
                      <Text type="secondary">Không có series nào, hãy tạo trước khi gắn bài viết.</Text>
                    )}
                  </Form.Item>
                </Col>
              </Row>

              {/* Tags */}
              <Form.Item
                name="tags"
                label={
                  <Space>
                    <TagsOutlined />
                    <strong>Thẻ (tags)</strong>
                    <Text type="secondary">– nhập để tạo mới</Text>
                  </Space>
                }
              >
                {loadingTags ? (
                  <Spin />
                ) : (
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
                )}
              </Form.Item>

              {/* Markdown Editor */}
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined />
                    <strong>Nội dung bài viết</strong>
                    <Text type="secondary">(Hỗ trợ Markdown)</Text>
                  </Space>
                }
              >
                {mounted && (
                  <div data-color-mode={mdColorMode} key={`wrap-${mdColorMode}`}>
                    <MDEditor
                      key={`mde-${mdColorMode}`}
                      value={contentMarkdown}
                      onChange={(v) => setContentMarkdown(v || "")}
                      height={500}
                      preview="live"
                      textareaProps={{
                        placeholder: `✍️ Bắt đầu viết bài tại đây...

# Tiêu đề chính
Viết phần mở đầu hấp dẫn cho bài viết của bạn.

## Mục 1
- Gạch đầu dòng 1
- Gạch đầu dòng 2

> Gợi ý: bạn có thể sử dụng **Markdown** để định dạng văn bản.`,
                      }}
                    />
                  </div>
                )}
              </Form.Item>

              {/* Thumbnail */}
              <Form.Item
                label={
                  <Space>
                    <PictureOutlined />
                    <strong>Ảnh thumbnail</strong>
                    <Text type="secondary">(không bắt buộc)</Text>
                  </Space>
                }
              >
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
                        {thumbnail ? thumbnail.name : "Chọn ảnh thumbnail"}
                      </Button>
                    </Upload>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      PNG, JPG, GIF tối đa 5MB
                    </Text>
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

              {/* Submit */}
              <Form.Item className="mb-0 mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{ width: "100%", height: 50, fontSize: 16, fontWeight: 600, borderRadius: 12 }}
                  disabled={!user}
                >
                  Xuất bản bài viết
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <div className="text-center mt-4">
            <Text type="secondary">
              Bài viết của bạn sẽ được duyệt trước khi hiển thị công khai
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleForm;
