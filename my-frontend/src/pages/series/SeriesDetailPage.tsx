import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSeriesBySlug, SeriesDto } from "@/services/seriesService";
import { Spin, Empty } from "antd";
import { BookOutlined, UserOutlined, PlusOutlined } from "@ant-design/icons";
import SeriesArticleCard from "@/components/layouts/article/SeriesArticleCard";

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
        const sortedArticles = data.articles
          ? [...data.articles].sort(
              (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
            )
          : [];
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
      {/* Header */}
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
                style={{ height: 250, fontSize: 60, color: "#ccc" }}
              >
                <BookOutlined />
              </div>
            )}
          </div>

          <div className="col-md-9 d-flex flex-column justify-content-center">
            <h1 className="mb-3 fw-bold">{series.title}</h1>
            <p className="text-invert mb-3 fs-6" style={{ lineHeight: 1.6 }}>
              {series.description || "Không có mô tả"}
            </p>

            <div className="d-flex gap-3 flex-wrap">
              {series.authorName && (
                <div className="d-flex align-items-center gap-2">
                  <UserOutlined className="text-primary" />
                  <span className="text-invert fw-bold">{series.authorName}</span>
                </div>
              )}
              {series.articles && (
                <div className="d-flex align-items-center gap-2">
                  <BookOutlined className="text-primary" />
                  <span className="text-invert">
                    <strong>{series.articles.length}</strong> bài viết
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="fw-bold d-flex align-items-center gap-2 mb-0">
            <BookOutlined /> Bài viết trong series
          </h4>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/series/edit/${series.slug}`)}
            >
              ✏️ Chỉnh sửa series
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/articles/create?seriesId=${series.id}`)}
            >
              <PlusOutlined /> Thêm bài viết
            </button>
          </div>
        </div>

        {series.articles && series.articles.length > 0 ? (
          <div className="row g-3">
            {series.articles.map((article) => (
              <div key={article.id} className="col-12">
                <SeriesArticleCard article={article} />
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
