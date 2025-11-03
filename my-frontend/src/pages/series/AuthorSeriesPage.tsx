import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSeriesByAuthor } from "@/services/seriesService";
import { Card, Spin, Empty, Typography, Avatar } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { getUserById } from "@/services/userService";

const { Title, Paragraph } = Typography;

interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
}

interface AuthorProfile {
  name: string;
  avatar?: string;
  school?: string;
}

export default function AuthorSeriesPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [seriesList, setSeriesList] = useState<SeriesDto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!authorId) return;
      setLoading(true);
      try {
        const [seriesRes, authorRes] = await Promise.all([
          getSeriesByAuthor(authorId, 0, 20),
          getUserById(authorId),
        ]);
        setSeriesList(seriesRes.content || []);
        setAuthor(authorRes);
      } catch (err) {
        console.error("Failed to load author series:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authorId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spin />
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header thông tin tác giả */}
      {author && (
        <div className="d-flex align-items-center mb-4">
          <Avatar
            src={author.avatar}
            size={64}
            icon={<BookOutlined />}
            className="me-3"
          />
          <div>
            <Title level={4} className="mb-0">
              {author.name}
            </Title>
            {author.school && (
              <Paragraph className="mb-0 text-muted small">
                {author.school}
              </Paragraph>
            )}
          </div>
        </div>
      )}

      <Title level={5} className="fw-semibold mb-3">
        Series của {author?.name || "người dùng"}
      </Title>

      {seriesList.length === 0 ? (
        <Empty description="Người này chưa tạo series nào" />
      ) : (
        <div className="row g-3">
          {seriesList.map((s) => (
            <div key={s.id} className="col-md-6 col-lg-4">
              <Card
                hoverable
                cover={
                  s.thumbnailUrl ? (
                    <img
                      alt={s.title}
                      src={s.thumbnailUrl}
                      style={{ height: 180, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light"
                      style={{ height: 180 }}
                    >
                      <BookOutlined style={{ fontSize: 40, color: "#999" }} />
                    </div>
                  )
                }
                onClick={() => navigate(`/series/${s.slug}`)}
              >
                <Card.Meta
                  title={s.title}
                  description={
                    <p className="text-muted small mb-0 text-truncate">
                      {s.description || "Không có mô tả"}
                    </p>
                  }
                />
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
