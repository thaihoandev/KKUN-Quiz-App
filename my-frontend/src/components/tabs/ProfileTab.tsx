import { formatDateOnly } from "@/utils/dateUtils";
import { UserResponseDTO } from "@/interfaces";
import { useState, useCallback, useEffect } from "react";
import { PostDTO } from "@/services/postService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import SelfPostList from "../layouts/post/SelfPostList";
import PostComposer from "../layouts/post/PostComposer";
import { getSeriesByAuthor, createSeries } from "@/services/seriesService";
import { Card, Button, Spin, Empty, Modal, Input, message } from "antd";
import { BookOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

interface ProfileTabProps {
  profile: UserResponseDTO | null;
  onEditProfile: () => void;
}

interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
}

const ProfileTab = ({ profile, onEditProfile }: ProfileTabProps) => {
  const [newPost, setNewPost] = useState<PostDTO | null>(null);
  const [seriesList, setSeriesList] = useState<SeriesDto[]>([]);
  const [loadingSeries, setLoadingSeries] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState(false);
  const [newSeries, setNewSeries] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {}, []);

  // ✅ Fetch user's own series
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

  useEffect(() => {
    fetchSeries();
  }, [profile?.userId]);

  // ✅ Create new series
  const handleCreateSeries = async () => {
    if (!newSeries.title.trim()) {
      message.warning("Vui lòng nhập tiêu đề series!");
      return;
    }
    if (!profile?.userId) return;

    setCreating(true);
    try {
      const created = await createSeries(
        newSeries.title,
        newSeries.description,
        profile.userId,
        newSeries.thumbnailUrl || undefined
      );
      if (created) {
        message.success("Tạo series thành công!");
        setOpenModal(false);
        setNewSeries({ title: "", description: "", thumbnailUrl: "" });
        fetchSeries();
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể tạo series.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row g-3">
        {/* LEFT SIDE: About + Overview + Series */}
        <div className="col-lg-4">
          {/* About */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-uppercase text-muted small">About</h6>
                <button
                  className="btn btn-outline-primary btn-sm rounded-circle p-1"
                  onClick={onEditProfile}
                  title="Edit Profile"
                  aria-label="Edit profile"
                >
                  <i className="bx bx-edit"></i>
                </button>
              </div>
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

          {/* ✅ Series List */}
          <Card
            title={
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold text-uppercase text-muted small">
                  <BookOutlined className="me-2" />
                  My Series
                </span>
              </div>
            }
            className="shadow-sm border-0"
            bodyStyle={{ padding: "1rem" }}
          >
            {loadingSeries ? (
              <div className="text-center py-4">
                <Spin />
              </div>
            ) : seriesList.length === 0 ? (
              <div className="text-center py-3">
                <Empty description="Bạn chưa tạo series nào" />
                {profile?.userId && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setOpenModal(true)}
                  >
                    Tạo series đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              <>
                {seriesList.map((s) => (
                  <div
                    key={s.id}
                    className="d-flex align-items-center mb-3 p-2 rounded hover-shadow-sm"
                    style={{ cursor: "pointer" }}
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

                <div className="d-flex justify-content-between mt-2">
                  <Button
                    type="link"
                    className="p-0 text-primary fw-semibold"
                    onClick={() => navigate(`/me/series`)}
                  >
                    Xem thêm <RightOutlined />
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/series/create")}
                  >
                    Tạo series mới
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* RIGHT SIDE: Composer + Posts */}
        <div className="col-lg-8">
          {profile?.userId ? (
            <PostComposer
              userId={profile.userId}
              avatarUrl={profile.avatar || unknownAvatar}
              onCreated={(post) => setNewPost(post)}
            />
          ) : (
            <div className="card border-0 shadow-sm mb-3 rounded-4">
              <div className="card-body p-4 text-center text-muted">
                Please log in to create a post.
              </div>
            </div>
          )}

          {profile?.userId ? (
            <SelfPostList
              profile={profile}
              onUpdate={handlePostUpdate}
              userId={profile.userId}
              newPost={newPost}
            />
          ) : (
            <div className="text-center text-muted py-3">
              Please log in to view posts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
