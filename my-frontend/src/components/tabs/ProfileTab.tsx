import { formatDateOnly } from "@/utils/dateUtils";
import { useState, useCallback, useEffect } from "react";
import { PostDTO } from "@/services/postService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import SelfPostList from "../layouts/post/SelfPostList";
import PostComposer from "../layouts/post/PostComposer";
import { getSeriesByAuthor, createSeries } from "@/services/seriesService";
import { notification } from "antd";
import { BookOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { User } from "@/types/users";

interface ProfileTabProps {
  profile: User | null;
  currentUser?: User | null;
  onEditProfile: () => void;
  isOwner?: boolean;
}

interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
}

const ProfileTab = ({
  profile,
  currentUser,
  onEditProfile,
  isOwner = false,
}: ProfileTabProps) => {
  const [newPost, setNewPost] = useState<PostDTO | null>(null);
  const [seriesList, setSeriesList] = useState<SeriesDto[]>([]);
  const [loadingSeries, setLoadingSeries] = useState<boolean>(true);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {}, []);

  // Load series của user
  const fetchSeries = async () => {
    if (!profile?.userId) return;
    setLoadingSeries(true);
    try {
      const res = await getSeriesByAuthor(profile.userId, 0, 4);
      setSeriesList(res.content || []);
    } catch (err) {
      console.error("Failed to load series:", err);
      notification.error({
        message: "Lỗi tải series",
        description: "Không thể tải danh sách series của người dùng.",
      });
    } finally {
      setLoadingSeries(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [profile?.userId]);

  // Tạo series mới (chỉ cho owner)
  const handleCreateSeries = async () => {
    if (!profile?.userId) return;
    try {
      const created = await createSeries(
        "New Series",
        "Mô tả ngắn cho series",
        profile.userId
      );
      if (created) {
        notification.success({
          message: "Tạo series thành công",
          description: "Series mới đã được tạo.",
        });
        fetchSeries();
      }
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Không thể tạo series",
        description: "Đã có lỗi xảy ra khi tạo series.",
      });
    }
  };

  return (
    <div
      className="container-fluid py-4"
      style={{
        background: "var(--background-color)",
        transition: "background 0.4s ease",
      }}
    >
      <div className="row g-3">
        {/* LEFT SIDE: About + Overview + Series */}
        <div className="col-lg-4">
          {/* About Card */}
          <div
            className="card border-0 shadow-sm mb-3"
            style={{
              background: "var(--surface-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "14px",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--hover-shadow)";
              e.currentTarget.style.borderColor = "var(--primary-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--card-shadow)";
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.5px",
                    margin: 0,
                  }}
                >
                  About
                </h6>
                {isOwner && (
                  <button
                    className="btn btn-sm rounded-circle p-1"
                    onClick={onEditProfile}
                    title="Edit Profile"
                    style={{
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--surface-alt)",
                      color: "var(--primary-color)",
                      border: "2px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-color)";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface-alt)";
                      e.currentTarget.style.color = "var(--primary-color)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    }}
                  >
                    <i className="bx bx-edit"></i>
                  </button>
                )}
              </div>

              <ul
                className="list-unstyled mb-0"
                style={{ listStyle: "none", padding: 0 }}
              >
                {[
                  {
                    icon: "bx-user",
                    label: "Name:",
                    value: profile?.name || "N/A",
                  },
                  {
                    icon: "bx-envelope",
                    label: "Email:",
                    value: profile?.email || "N/A",
                  },
                  {
                    icon: "bx-building",
                    label: "School:",
                    value: profile?.school || "N/A",
                  },
                  {
                    icon: "bx-calendar",
                    label: "Joined:",
                    value: profile?.createdAt
                      ? formatDateOnly(profile.createdAt)
                      : "N/A",
                  },
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="d-flex align-items-center mb-2"
                    style={{
                      color: "var(--text-color)",
                      transition: "color 0.25s ease",
                    }}
                  >
                    <i
                      className={`bx ${item.icon}`}
                      style={{
                        marginRight: "0.5rem",
                        color: "var(--text-muted)",
                        fontSize: "1.1rem",
                      }}
                    ></i>
                    <span
                      style={{
                        fontWeight: 600,
                        marginRight: "0.5rem",
                        color: "var(--text-light)",
                      }}
                    >
                      {item.label}
                    </span>
                    <span style={{ color: "var(--text-color)" }}>
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Overview Card */}
          <div
            className="card border-0 shadow-sm mb-3"
            style={{
              background: "var(--surface-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "14px",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--hover-shadow)";
              e.currentTarget.style.borderColor = "var(--primary-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--card-shadow)";
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            <div className="card-body p-4">
              <h6
                style={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  letterSpacing: "0.5px",
                  marginBottom: "1rem",
                }}
              >
                Overview
              </h6>

              <div className="row g-3">
                {[
                  { title: "Quizzes Taken", subtitle: "Coming soon!" },
                  { title: "Achievements", subtitle: "Coming soon!" },
                ].map((item, idx) => (
                  <div key={idx} className="col-6">
                    <div
                      style={{
                        background: "var(--surface-alt)",
                        border: "2px solid var(--border-color)",
                        borderRadius: "12px",
                        padding: "1rem",
                        textAlign: "center",
                        minHeight: "100px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        transition: "all 0.25s ease",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--primary-color)";
                        e.currentTarget.style.boxShadow =
                          "var(--hover-shadow)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-color)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <h6
                        style={{
                          fontWeight: 600,
                          color: "var(--text-color)",
                          margin: "0 0 0.5rem",
                          fontSize: "0.95rem",
                        }}
                      >
                        {item.title}
                      </h6>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                          margin: 0,
                        }}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Series Card */}
          <div
            style={{
              background: "var(--surface-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--hover-shadow)";
              e.currentTarget.style.borderColor = "var(--primary-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--card-shadow)";
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            {/* Title */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                paddingBottom: "1rem",
                borderBottom: "2px solid var(--border-color)",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <BookOutlined style={{ fontSize: "1rem" }} />
                {isOwner ? "My Series" : "Series"}
              </span>
            </div>

            {/* Content */}
            {loadingSeries ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 1rem",
                  color: "var(--text-muted)",
                }}
              >
                <i
                  className="bx bx-loader-alt bx-spin"
                  style={{ fontSize: "1.5rem" }}
                ></i>
                <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                  Đang tải...
                </p>
              </div>
            ) : seriesList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <BookOutlined
                  style={{
                    fontSize: "2rem",
                    color: "var(--text-muted)",
                    opacity: 0.5,
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    color: "var(--text-muted)",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {isOwner
                    ? "Bạn chưa tạo series nào"
                    : `${profile?.name || "Người dùng"} chưa có series nào`}
                </p>
                {isOwner && (
                  <button
                    onClick={() => navigate("/series/create")}
                    style={{
                      background: "var(--gradient-primary)",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <PlusOutlined /> Tạo series đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Series List */}
                {seriesList.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "1rem",
                      padding: "0.75rem",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: "var(--surface-alt)",
                      transition: "all 0.25s ease",
                    }}
                    onClick={() => navigate(`/series/${s.slug}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-color)20";
                      e.currentTarget.style.borderLeft = "3px solid var(--primary-color)";
                      e.currentTarget.style.paddingLeft = "0.5rem";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface-alt)";
                      e.currentTarget.style.borderLeft = "none";
                      e.currentTarget.style.paddingLeft = "0.75rem";
                    }}
                  >
                    {s.thumbnailUrl ? (
                      <img
                        src={s.thumbnailUrl}
                        alt={s.title}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginRight: "0.75rem",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          background: "var(--surface-color)",
                          border: "2px solid var(--border-color)",
                          borderRadius: "8px",
                          marginRight: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <BookOutlined
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "1.25rem",
                          }}
                        />
                      </div>
                    )}
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <h6
                        style={{
                          marginBottom: "0.25rem",
                          color: "var(--text-color)",
                          fontWeight: 600,
                          transition: "color 0.25s ease",
                        }}
                      >
                        {s.title}
                      </h6>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                          marginBottom: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.description || "Không có mô tả"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Footer Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "2px solid var(--border-color)",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    onClick={() =>
                      isOwner
                        ? navigate(`/me/series`)
                        : navigate(`/users/${profile?.userId}/series`)
                    }
                    style={{
                      background: "transparent",
                      color: "var(--primary-color)",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      padding: "0.5rem 0",
                      transition: "all 0.25s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--primary-dark)";
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--primary-color)";
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    Xem thêm <RightOutlined style={{ fontSize: "0.8rem" }} />
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => navigate("/series/create")}
                      style={{
                        background: "var(--gradient-primary)",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "12px",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        transition: "all 0.25s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <PlusOutlined style={{ fontSize: "0.8rem" }} />
                      Tạo mới
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Posts */}
        <div className="col-lg-8">
          {isOwner ? (
            <>
              <PostComposer
                userId={profile?.userId || ""}
                avatarUrl={profile?.avatar || unknownAvatar}
                onCreated={(post) => setNewPost(post)}
              />
              <SelfPostList
                profile={profile}
                currentUser={currentUser}
                onUpdate={handlePostUpdate}
                userId={profile?.userId || ""}
                newPost={newPost}
              />
            </>
          ) : (
            <SelfPostList
              profile={profile}
              currentUser={currentUser}
              onUpdate={handlePostUpdate}
              userId={profile?.userId || ""}
              newPost={newPost}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .bx-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProfileTab;