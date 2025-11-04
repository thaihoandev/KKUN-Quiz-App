import { useState, useEffect } from "react";
import { Input, Button, Card, message } from "antd";
import { createSeries } from "@/services/seriesService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BookOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const CreateSeriesPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      message.warning("Vui lòng nhập tiêu đề series!");
      return;
    }
    if (!user?.userId) {
      message.error("Bạn cần đăng nhập để tạo series!");
      return;
    }

    setLoading(true);
    try {
      const created = await createSeries(
        form.title,
        form.description,
        user.userId,
        form.thumbnailUrl || undefined
      );
      if (created) {
        message.success("Tạo series thành công!");
        navigate(`/series/${created.slug}`);
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể tạo series.");
    } finally {
      setLoading(false);
    }
  };

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
            Tạo Series Mới
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
          onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            loading={loading}
            onClick={handleSubmit}
            disabled={!form.title.trim()}
          >
            Tạo Series
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CreateSeriesPage;
