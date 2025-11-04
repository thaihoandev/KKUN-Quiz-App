import { useEffect, useState } from "react";
import { Input, Button, Card, Spin, message } from "antd";
import { getSeriesBySlug, updateSeries } from "@/services/seriesService";
import { useNavigate, useParams } from "react-router-dom";
import { BookOutlined, ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
}

export default function EditSeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Load series info
  useEffect(() => {
    const fetchSeries = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        // có thể đổi sang getSeriesById nếu backend hỗ trợ
        const data = await getSeriesBySlug(slug);
        if (!data) {
          message.error("Không tìm thấy series.");
          navigate("/me/series");
          return;
        }
        setForm({
          title: data.title,
          description: data.description || "",
          thumbnailUrl: data.thumbnailUrl || "",
        });
      } catch (err) {
        console.error(err);
        message.error("Không thể tải thông tin series.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [slug]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      message.warning("Vui lòng nhập tiêu đề series!");
      return;
    }
    if (!slug) return;

    setSaving(true);
    try {
      const updated = await updateSeries(
        slug,
        form.title,
        form.description,
        form.thumbnailUrl || undefined
      );
      if (updated) {
        message.success("Cập nhật series thành công!");
        navigate(`/series/${updated.slug}`);
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể cập nhật series.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="container py-5">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className="mb-3"
      >
        Quay lại
      </Button>

      <Card
        title={
          <span className="fw-semibold">
            <BookOutlined className="me-2" />
            Chỉnh sửa Series
          </span>
        }
        className="shadow-sm border-0"
      >
        <Input
          placeholder="Tiêu đề series"
          className="mb-3"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Input.TextArea
          placeholder="Mô tả series"
          rows={3}
          className="mb-3"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
        <Input
          placeholder="Thumbnail URL (tùy chọn)"
          className="mb-4"
          value={form.thumbnailUrl}
          onChange={(e) =>
            setForm({ ...form, thumbnailUrl: e.target.value })
          }
        />

        <div className="text-end">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            disabled={!form.title.trim()}
          >
            Lưu thay đổi
          </Button>
        </div>
      </Card>
    </div>
  );
}
