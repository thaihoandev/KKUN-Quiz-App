import { useEffect, useState } from "react";
import {
  Input,
  Button,
  Card,
  Spin,
  Divider,
  Typography,
  List,
  notification,
  Popconfirm,
} from "antd";
import {
  getSeriesBySlug,
  updateSeries,
  updateArticleOrder,
  removeArticleFromSeries,
} from "@/services/seriesService";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  MenuOutlined,
  CheckOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ArticleDto } from "@/types/article";

const { Text } = Typography;

export default function EditSeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    thumbnailUrl: "",
  });

  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);

  // ✅ Load dữ liệu series + bài viết
  useEffect(() => {
    const fetchSeries = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await getSeriesBySlug(slug);
        if (!data) {
          notification.error({
            message: "Không tìm thấy series",
            description: "Series này không tồn tại hoặc đã bị xóa.",
          });
          navigate("/me/series");
          return;
        }

        setForm({
          id: data.id,
          title: data.title,
          description: data.description || "",
          thumbnailUrl: data.thumbnailUrl || "",
        });

        const sortedArticles =
          data.articles?.sort(
            (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
          ) || [];
        setArticles(sortedArticles);
      } catch (err) {
        console.error(err);
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: "Không thể tải thông tin series. Vui lòng thử lại.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [slug, navigate]);

  // ✅ Lưu thông tin series
  const handleSaveInfo = async () => {
    if (!form.title.trim()) {
      notification.warning({
        message: "Thiếu tiêu đề",
        description: "Vui lòng nhập tiêu đề cho series.",
      });
      return;
    }
    if (!form.id) return;

    setSavingInfo(true);
    try {
      const updated = await updateSeries(
        form.id,
        form.title,
        form.description,
        form.thumbnailUrl || undefined
      );
      if (updated) {
        notification.success({
          message: "Cập nhật thành công",
          description: "Thông tin series đã được lưu lại.",
        });
      }
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Cập nhật thất bại",
        description: "Không thể lưu thông tin series. Vui lòng thử lại.",
      });
    } finally {
      setSavingInfo(false);
    }
  };

  // ✅ Kéo-thả reorder
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(articles);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    reordered.forEach((a, i) => (a.orderIndex = i + 1));
    setArticles(reordered);
    setOrderChanged(true);
  };

  // ✅ Lưu thứ tự bài viết
  const handleSaveOrder = async () => {
    if (!form.id) return;
    setSavingOrder(true);
    try {
      const ids = articles.map((a) => a.id);
      const ok = await updateArticleOrder(form.id, ids);
      if (ok) {
        notification.success({
          message: "Cập nhật thứ tự thành công",
          description: "Thứ tự bài viết trong series đã được cập nhật.",
        });
        setOrderChanged(false);
      }
    } catch {
      notification.error({
        message: "Lưu thứ tự thất bại",
        description: "Vui lòng thử lại hoặc kiểm tra kết nối mạng.",
      });
    } finally {
      setSavingOrder(false);
    }
  };

  // ✅ Xóa bài viết khỏi series
  const handleRemoveArticle = async (articleId: string) => {
    if (!form.id) return;
    try {
      const ok = await removeArticleFromSeries(form.id, articleId);
      if (ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
        notification.success({
          message: "Đã xóa khỏi series",
          description: "Bài viết đã được gỡ khỏi series này.",
        });
      }
    } catch {
      notification.error({
        message: "Xóa thất bại",
        description: "Không thể gỡ bài viết khỏi series. Vui lòng thử lại.",
      });
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
      {/* 🔙 Back */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className="mb-3"
      >
        Quay lại
      </Button>

      {/* 🧾 Form chỉnh sửa */}
      <Card
        title={
          <span className="fw-semibold">
            <BookOutlined className="me-2" />
            Thông tin Series
          </span>
        }
        className="shadow-sm border-0 mb-5"
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
            icon={<SaveOutlined />}
            loading={savingInfo}
            onClick={handleSaveInfo}
            disabled={!form.title.trim()}
          >
            Lưu thông tin
          </Button>
        </div>
      </Card>

      {/* 🔄 Sắp xếp bài viết */}
      <Card
        title={
          <span className="fw-semibold">
            <MenuOutlined className="me-2" />
            Sắp xếp và quản lý bài viết
          </span>
        }
        className="shadow-sm border-0"
      >
        {articles.length === 0 ? (
          <Text type="secondary">Series chưa có bài viết nào.</Text>
        ) : (
          <>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="articles">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    <List
                      dataSource={articles}
                      renderItem={(a, index) => (
                        <Draggable draggableId={a.id} index={index} key={a.id}>
                          {(drag) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              className="border rounded p-2 mb-2 bg-light d-flex align-items-center justify-content-between"
                            >
                              {/* 👉 Nhóm kéo-thả + nội dung */}
                              <div className="d-flex align-items-center gap-3">
                                {/* 3 gạch nằm trước để kéo */}
                                <MenuOutlined className="text-muted fs-5" />

                                <div>
                                  <Text strong>
                                    {index + 1}. {a.title}
                                  </Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {a.description || "Không có mô tả"}
                                  </Text>
                                </div>
                              </div>

                              {/* Nút xóa ở cuối */}
                              <Popconfirm
                                title="Gỡ bài viết khỏi series?"
                                okText="Xóa"
                                cancelText="Hủy"
                                onConfirm={() => handleRemoveArticle(a.id)}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                />
                              </Popconfirm>
                            </div>
                          )}
                        </Draggable>
                      )}
                    >
                      {provided.placeholder}
                    </List>

                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Divider />

            <div className="text-end">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={savingOrder}
                disabled={!orderChanged}
                onClick={handleSaveOrder}
              >
                Lưu thứ tự bài viết
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
