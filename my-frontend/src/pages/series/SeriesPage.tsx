import { useEffect, useState } from "react";
import { getSeriesByAuthor } from "@/services/seriesService";
import { useNavigate } from "react-router-dom";
import { Button, Spin, Empty } from "antd";
import { BookOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";

interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesDto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSeries = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const res = await getSeriesByAuthor(user.userId, 0, 20);
        setSeriesList(res.content || []);
      } catch (err) {
        console.error("Failed to fetch series:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [user?.userId]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete logic
    console.log("Delete series:", id);
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/series/edit/${id}`);
  };

  return (
    <div className="py-5" style={{ background: "var(--background-color)" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 className="fw-bold mb-2 d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 45,
                  height: 45,
                  background: "var(--gradient-primary)",
                  color: "white",
                  fontSize: 24,
                }}
              >
                <BookOutlined />
              </div>
              Series của tôi
            </h2>
            <p className="text-muted mb-0">
              {seriesList.length} series được tạo
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate("/series/create")}
            style={{ borderRadius: 12, height: 45, fontSize: 16 }}
          >
            Tạo Series
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <Spin size="large" />
          </div>
        ) : seriesList.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 mx-auto"
              style={{
                width: 80,
                height: 80,
                background: "var(--surface-alt)",
              }}
            >
              <BookOutlined style={{ fontSize: 40, color: "var(--text-muted)" }} />
            </div>
            <h5 className="fw-bold mb-2">Chưa có series nào</h5>
            <p className="text-muted mb-4">
              Hãy tạo series đầu tiên của bạn để tổ chức các bài viết theo chủ đề
            </p>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate("/series/create")}
              style={{ borderRadius: 12, width: "auto" }}
            >
              Tạo Series Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="row g-4">
            {seriesList.map((series) => (
              <div key={series.id} className="col-md-6 col-lg-4">
                <div
                  className="card border-0 shadow-sm overflow-hidden rounded-4 h-100"
                  style={{
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(96, 165, 250, 0.15)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 12px rgba(0, 0, 0, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  onClick={() => navigate(`/series/${series.slug}`)}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      height: 200,
                      background: series.thumbnailUrl
                        ? `url(${series.thumbnailUrl}) center / cover`
                        : "var(--surface-alt)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {!series.thumbnailUrl && (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <BookOutlined
                          style={{
                            fontSize: 50,
                            color: "var(--text-muted)",
                          }}
                        />
                      </div>
                    )}
                    {/* Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0)",
                        transition: "background 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.background =
                          "rgba(0, 0, 0, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.background =
                          "rgba(0, 0, 0, 0)";
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-bold mb-2 text-dark line-clamp-2">
                      {series.title}
                    </h6>
                    <p
                      className="text-muted small mb-3 flex-grow-1"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {series.description || "Không có mô tả"}
                    </p>

                    {/* Actions */}
                    <div className="d-flex gap-2 pt-2 border-top">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        className="flex-grow-1"
                        onClick={(e) => handleEdit(series.slug, e)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        className="flex-grow-1"
                        onClick={(e) => handleDelete(series.id, e)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}