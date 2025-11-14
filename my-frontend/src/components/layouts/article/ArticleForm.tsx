// src/pages/articles/ArticleCreatePage.tsx

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

/** Đọc mode từ localStorage */
function resolveModeFromLocalStorage(): "light" | "dark" {
  try {
    const keys = ["theme", "color-theme", "app-theme", "mode"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;

      const v = raw.toLowerCase().trim();
      if (v.includes("dark")) return "dark";
      if (v.includes("light")) return "light";
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

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  /** Theme cho MDEditor */
  const [mdColorMode, setMdColorMode] = useState<"light" | "dark">(
    () => resolveModeFromLocalStorage()
  );
  const [mounted, setMounted] = useState(true);

  // Khi theme đổi, remount editor
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", mdColorMode);
    setMounted(false);

    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, [mdColorMode]);

  // Nghe sự kiện theme-change
  useEffect(() => {
    const apply = () => setMdColorMode(resolveModeFromLocalStorage());

    const onStorage = (e: StorageEvent) => {
      if (["theme", "color-theme", "app-theme", "mode"].includes(e.key || "")) {
        apply();
      }
    };
    window.addEventListener("storage", onStorage);

    const onThemeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.mode) {
        setMdColorMode(detail.mode);
      } else apply();
    };
    window.addEventListener("theme-change", onThemeChange as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theme-change", onThemeChange as EventListener);
    };
  }, []);

  // -----------------------------
  // Load categories / tags / series
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingTags(true);
        setLoadingSeries(true);

        const [catRes, tagRes, seriesRes] = await Promise.all([
          getCategories(0, 50, "name,asc"),
          getTags(0, 50, "name,asc"),
          user?.userId
            ? getSeriesByAuthor(String(user.userId), 0, 20, "createdAt,desc")
            : Promise.resolve({ content: [] }),
        ]);

        setCategories(catRes.content);
        setTags(tagRes.content);
        setSeries(seriesRes.content ?? []);

        if (seriesIdFromParams) {
          form.setFieldValue("seriesId", seriesIdFromParams);
        }
      } catch {
        message.error("Không thể tải dữ liệu!");
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
        setLoadingSeries(false);
      }
    };

    fetchData();
  }, [form, seriesIdFromParams, user?.userId]);

  // Upload thumbnail
  const handleThumbnailChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    setThumbnail(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ---------------------------------------
  // Submit article
  // ---------------------------------------
  const handleSubmit = async (values: ArticleFormValues) => {
    if (!user?.userId) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng đăng nhập!",
      });
      return;
    }

    if (!contentMarkdown.trim()) {
      notification.error({
        message: "Thiếu nội dung",
        description: "Vui lòng nhập nội dung bài viết.",
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

    if (values.tags) {
      values.tags.forEach((tag) => formData.append("tags", tag));
    }

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

      if (seriesIdFromParams) {
        const selectedSeries = series.find((s) => s.id === seriesIdFromParams);
        navigate(selectedSeries ? `/series/${selectedSeries.id}` : "/articles");
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

  // Create new tag
  const handleTagCreate = async (newTagName: string) => {
    const existing = tags.find(
      (t) => t.name.toLowerCase() === newTagName.toLowerCase()
    );
    if (existing) {
      notification.warning({
        message: "Tag đã tồn tại",
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
        message: "Không thể tạo tag mới!",
      });
    }
  };

  // ---------------------------------------
  // JSX
  // ---------------------------------------
  return (
    <div className="py-5">
      <div className="d-flex justify-content-center">
        <div className="col-lg-12 col-xl-11">
          <div className="text-center mb-5">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle mb-3"
              style={{ width: 70, height: 70 }}
            >
              <FileTextOutlined style={{ fontSize: 32, color: "#fff" }} />
            </div>
            <Title level={2}>Tạo bài viết mới</Title>
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
              {/* title */}
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
                <Input size="large" placeholder="Nhập tiêu đề..." />
              </Form.Item>

              {/* Category / difficulty / series */}
              <Row gutter={16}>
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
                        placeholder="-- Chọn chuyên mục --"
                        options={categories.map((c) => ({
                          label: c.name,
                          value: c.id,
                        }))}
                      />
                    )}
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="difficulty"
                    label={
                      <Space>
                        <BarChartOutlined />
                        <strong>Độ khó</strong>
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
                        <ReadOutlined />
                        <strong>Series</strong>
                      </Space>
                    }
                  >
                    {loadingSeries ? (
                      <Spin />
                    ) : (
                      <Select
                        allowClear
                        size="large"
                        placeholder="-- Series --"
                        options={series.map((s) => ({
                          label: s.title,
                          value: s.id,
                        }))}
                      />
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
                    options={tags.map((t) => ({
                      label: t.name,
                      value: t.name,
                    }))}
                  />
                )}
              </Form.Item>

              {/* Markdown Editor */}
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined />
                    <strong>Nội dung bài viết</strong>
                  </Space>
                }
              >
                {mounted && (
                  <div data-color-mode={mdColorMode} key={`wrap-${mdColorMode}`}>
                    <MDEditor
                      key={`md-${mdColorMode}`}
                      value={contentMarkdown}
                      onChange={(v) => setContentMarkdown(v || "")}
                      height={500}
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
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col xs={24} md={thumbnailPreview ? 16 : 24}>
                    <Upload
                      beforeUpload={() => false}
                      maxCount={1}
                      onChange={handleThumbnailChange}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />} block size="large">
                        {thumbnail ? thumbnail.name : "Chọn ảnh"}
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

              {/* Submit */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{ width: "100%", height: 50 }}
                  disabled={!user}
                >
                  Xuất bản bài viết
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <div className="text-center mt-4">
            <Text type="secondary">
              Bài viết của bạn sẽ được duyệt trước khi hiển thị.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleForm;
