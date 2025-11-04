import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSeriesBySlug, SeriesDto } from "@/services/seriesService";
import { Spin, Empty } from "antd";
import {
  BookOutlined,
  CalendarOutlined,
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { ArticleDto } from "@/types/article";

export default function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<SeriesDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
        if (!slug) return;
        setLoading(true);
        try {
        const data = await getSeriesBySlug(slug);
        if (!data) {
            setSeries(null);
            return;
        }

        // ✅ Sắp xếp bài viết theo orderIndex
        const sortedArticles = data.articles
            ? [...data.articles].sort(
                (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
            )
            : [];

        // ✅ Ép kiểu rõ ràng, đảm bảo không undefined
        setSeries({ ...(data as SeriesDto), articles: sortedArticles });
        } catch (err) {
        console.error("Failed to fetch series:", err);
        } finally {
        setLoading(false);
        }
    };
    fetchSeries();
    }, [slug]);


  if (loading)
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <Spin size="large" />
      </div>
    );

  if (!series)
    return (
      <div className="container py-5">
        <Empty description="Không tìm thấy series này" />
      </div>
    );

  return (
    <div className="container py-5">
      {/* Header Card */}
      <div className="card card-header mb-5 overflow-hidden">
        <div className="row g-4 p-5">
          <div className="col-md-3">
            {series.thumbnailUrl ? (
              <img
                src={series.thumbnailUrl}
                alt={series.title}
                className="img-fluid rounded shadow-sm"
                style={{ objectFit: "cover", height: 250 }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center bg-light rounded"
                style={{
                  height: 250,
                  fontSize: 60,
                  color: "#ccc",
                }}
              >
                <BookOutlined />
              </div>
            )}
          </div>

          <div className="col-md-9 d-flex flex-column justify-content-center">
            <h1 className="mb-3 fw-bold">{series.title}</h1>
            <p className="text-muted mb-3 fs-6" style={{ lineHeight: 1.6 }}>
              {series.description || "Không có mô tả"}
            </p>

            <div className="d-flex gap-3 flex-wrap">
              {series.authorName && (
                <div className="d-flex align-items-center gap-2">
                  <UserOutlined className="text-primary" />
                  <span className="text-muted">
                    <strong>{series.authorName}</strong>
                  </span>
                </div>
              )}
              {series.articles && (
                <div className="d-flex align-items-center gap-2">
                  <BookOutlined className="text-primary" />
                  <span className="text-muted">
                    <strong>{series.articles.length}</strong> bài viết
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="fw-bold d-flex align-items-center gap-2 mb-0">
            <BookOutlined /> Bài viết trong series
          </h4>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/articles/create?seriesId=${series.id}`)}
          >
            <PlusOutlined /> Thêm bài viết
          </button>
        </div>

        {series.articles && series.articles.length > 0 ? (
          <div className="row g-3">
            {series.articles.map((article) => (
              <div key={article.id} className="col-12">
                <a
                  href={`/articles/${article.slug}`}
                  className="text-decoration-none"
                >
                  <div
                    className="card card-body border-0 shadow-sm transition-all h-100"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(96, 165, 250, 0.15)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 2px 12px rgba(0, 0, 0, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      {/* ✅ Hiển thị orderIndex */}
                      <div
                        className="badge bg-primary-soft fw-bold d-flex align-items-center justify-content-center"
                        style={{
                          minWidth: 40,
                          height: 40,
                          fontSize: 14,
                        }}
                      >
                        {article.orderIndex ?? "?"}
                      </div>

                      <div className="flex-grow-1">
                        <h6 className="mb-2 fw-bold">
                          {article.title}
                        </h6>
                        <p className="text-muted small mb-2">
                          {article.description || "Không có mô tả"}
                        </p>
                        <div className="d-flex align-items-center gap-2">
                          <UserOutlined className="text-muted" />
                          <small className="text-muted">
                            {article.authorName || "Anonymous"}
                          </small>
                        </div>
                      </div>

                      <div className="text-end d-flex flex-column gap-2 align-items-end">
                        <span className="badge bg-light text-dark border">
                          Đọc →
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <Empty description="Series này chưa có bài viết" />
          </div>
        )}
      </div>
    </div>
  );
}
