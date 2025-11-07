import { formatDateOnly } from "@/utils/dateUtils";
import SelfPostList from "../layouts/post/SelfPostList";
import { useCallback, useEffect, useState } from "react";
import { PostDTO } from "@/services/postService";
import { getSeriesByAuthor } from "@/services/seriesService";
import { Card, Button, Spin, Empty } from "antd";
import { BookOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { User } from "@/types/users";

interface ViewProfileTabProps {
  profile: User | null;
}

interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
}

const ViewProfileTab = ({ profile }: ViewProfileTabProps) => {
  const [newPost, setNewPost] = useState<PostDTO | null>(null);
  const [seriesList, setSeriesList] = useState<SeriesDto[]>([]);
  const [loadingSeries, setLoadingSeries] = useState<boolean>(true);

  const navigate = useNavigate();

  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {
    // TODO: xử lý cập nhật local state nếu cần
  }, []);

  useEffect(() => {
    const fetchSeries = async () => {
      if (!profile?.userId) return;
      setLoadingSeries(true);
      try {
        const res = await getSeriesByAuthor(profile.userId, 0, 4);
        setSeriesList(res.content || []);
      } catch (err) {
        console.error("Failed to load series:", err);
      } finally {
        setLoadingSeries(false);
      }
    };
    fetchSeries();
  }, [profile?.userId]);

  return (
    <div className="container-fluid py-4">
      <div className="row g-3">
        {/* LEFT SIDE: Profile Info */}
        <div className="col-lg-4">
          {/* About */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-3">
                About
              </h6>
              <ul className="list-unstyled mb-0">
                <li className="d-flex align-items-center mb-2">
                  <i className="bx bx-user me-2 text-muted"></i>
                  <span className="fw-medium me-2">Name:</span>
                  <span>{profile?.name || "N/A"}</span>
                </li>
                <li className="d-flex align-items-center mb-2">
                  <i className="bx bx-envelope me-2 text-muted"></i>
                  <span className="fw-medium me-2">Email:</span>
                  <span>{profile?.email || "N/A"}</span>
                </li>
                <li className="d-flex align-items-center mb-2">
                  <i className="bx bx-building me-2 text-muted"></i>
                  <span className="fw-medium me-2">School:</span>
                  <span>{profile?.school || "N/A"}</span>
                </li>
                <li className="d-flex align-items-center">
                  <i className="bx bx-calendar me-2 text-muted"></i>
                  <span className="fw-medium me-2">Joined:</span>
                  <span>
                    {profile?.createdAt
                      ? formatDateOnly(profile.createdAt)
                      : "N/A"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Overview */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-3">
                Overview
              </h6>
              <div className="row g-3">
                <div className="col-6">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body text-center p-3">
                      <h6 className="mb-1">Quizzes Taken</h6>
                      <p className="text-muted mb-0 small">Coming soon!</p>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body text-center p-3">
                      <h6 className="mb-1">Achievements</h6>
                      <p className="text-muted mb-0 small">Coming soon!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Series list */}
          <Card
            title={
              <span className="fw-bold text-uppercase text-muted small">
                <BookOutlined className="me-2" />
                Series
              </span>
            }
            className="shadow-sm border-0"
            bodyStyle={{ padding: "1rem" }}
          >
            {loadingSeries ? (
              <div className="text-center py-4">
                <Spin />
              </div>
            ) : seriesList.length === 0 ? (
              <Empty description="Chưa có series nào" />
            ) : (
              <>
                {seriesList.map((s) => (
                  <div
                    key={s.id}
                    className="d-flex align-items-center mb-3 p-2 rounded hover-shadow-sm"
                    style={{
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onClick={() => navigate(`/series/${s.slug}`)}
                  >
                    {s.thumbnailUrl ? (
                      <img
                        src={s.thumbnailUrl}
                        alt={s.title}
                        className="me-3 rounded"
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="me-3 d-flex align-items-center justify-content-center bg-light rounded"
                        style={{ width: 50, height: 50 }}
                      >
                        <BookOutlined style={{ color: "#999", fontSize: 20 }} />
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{s.title}</h6>
                      <p className="text-muted small mb-0 text-truncate">
                        {s.description || "Không có mô tả"}
                      </p>
                    </div>
                  </div>
                ))}
                {seriesList.length >= 4 && (
                  <Button
                    type="link"
                    className="p-0 mt-2 text-primary fw-semibold"
                    onClick={() => navigate(`/author/${profile?.userId}/series`)}
                  >
                    Xem thêm <RightOutlined />
                  </Button>
                )}
              </>
            )}
          </Card>
        </div>

        {/* RIGHT SIDE: Self Posts */}
        <div className="col-lg-8">
          {profile?.userId ? (
            <SelfPostList
              profile={profile}
              onUpdate={handlePostUpdate}
              userId={profile.userId}
              newPost={newPost}
            />
          ) : (
            <div className="text-center text-muted py-3">
              No profile to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProfileTab;
