import { useEffect, useMemo, useState } from "react";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { useAuthStore } from "@/store/authStore";
import {
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "@/services/userService";
import { User } from "@/types/users";

type FriendshipStatus = "NONE" | "REQUESTED" | "INCOMING" | "FRIEND";

interface HeaderProfileProps {
  profile: User | null;
  onEditAvatar?: () => void;
}

const HeaderProfile = ({ profile, onEditAvatar }: HeaderProfileProps) => {
  const me = useAuthStore((s) => s.user);
  const isOwner = useMemo(
    () => Boolean(me?.userId && profile?.userId && me.userId === profile.userId),
    [me?.userId, profile?.userId]
  );

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [status, setStatus] = useState<FriendshipStatus>("NONE");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [acting, setActing] = useState(false);
  const [isDark, setIsDark] = useState(false);

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

  const avatarSrc = profile?.avatar?.trim() || unknownAvatar;

  const refreshStatus = async () => {
    if (!profile?.userId || !me?.userId || isOwner) {
      setStatus("NONE");
      setRequestId(null);
      return;
    }
    setLoadingStatus(true);
    try {
      const res = await getFriendshipStatus(profile.userId);
      setStatus(res.status as FriendshipStatus);
      setRequestId(res.requestId ?? null);
    } catch {
      // Keep current status if error
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    setStatus("NONE");
    setRequestId(null);
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.userId, me?.userId, isOwner]);

  const handleAvatarClick = () => setShowAvatarModal(true);
  const handleCloseModal = () => setShowAvatarModal(false);

  const handleConnect = async () => {
    if (!profile?.userId || acting) return;
    setActing(true);
    try {
      await sendFriendRequest(profile.userId);
      await refreshStatus();
    } finally {
      setActing(false);
    }
  };

  const handleAccept = async () => {
    if (!requestId || acting) return;
    setActing(true);
    try {
      await acceptFriendRequest(requestId);
      await refreshStatus();
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    if (!requestId || acting) return;
    setActing(true);
    try {
      await declineFriendRequest(requestId);
      await refreshStatus();
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!requestId || acting) return;
    setActing(true);
    try {
      await cancelFriendRequest(requestId);
      await refreshStatus();
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div
            className="card mb-6 mt-3"
            style={{
              background: "var(--surface-color)",
              border: "2px solid var(--border-color)",
              borderRadius: "14px",
              transition: "all 0.25s ease",
            }}
          >
            {/* Banner */}
            {/* <div
              className="user-profile-header-banner"
              style={{
                height: "140px",
                background: "var(--gradient-primary)",
                transition: "all 0.25s ease",
              }}
            /> */}

            {/* Profile Content */}
            <div className="user-profile-header d-flex flex-column flex-lg-row text-sm-start text-center mb-3">
              {/* Avatar Section */}
              <div className="flex-shrink-0 mx-auto position-relative">
                <div
                  className="avatar avatar-xl rounded-circle overflow-hidden"
                  style={{
                    width: "140px",
                    height: "140px",
                    cursor: "pointer",
                    border: "4px solid var(--surface-color)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    marginTop: "0px",
                    transition: "all 0.25s ease",
                  }}
                  onClick={handleAvatarClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <img
                    src={avatarSrc}
                    alt={profile?.name || "User avatar"}
                    className="w-100 h-100"
                    style={{
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = unknownAvatar;
                    }}
                  />
                </div>

                {/* Edit Avatar Button */}
                {isOwner && onEditAvatar && (
                  <button
                    className="btn btn-icon rounded-circle position-absolute"
                    style={{
                      transform: "translate(10%, 10%)",
                      width: "36px",
                      height: "36px",
                      bottom: "20px",
                      right: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--gradient-primary)",
                      color: "white",
                      border: "2px solid var(--surface-color)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      fontSize: "1rem",
                    }}
                    onClick={onEditAvatar}
                    title="Edit Avatar"
                    aria-label="Edit avatar"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                      e.currentTarget.style.transform = "translate(10%, 10%) scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translate(10%, 10%) scale(1)";
                    }}
                  >
                    <i className="bx bx-edit"></i>
                  </button>
                )}
              </div>

              {/* User Info */}
              <div className="flex-grow-1 mt-3 mt-lg-5">
                <div className="d-flex align-items-md-end align-items-sm-start align-items-center justify-content-md-between justify-content-start mx-5 flex-md-row flex-column gap-4">
                  <div className="user-profile-info">
                    <h4
                      className="mb-2 mt-lg-7"
                      style={{
                        color: "var(--text-color)",
                        fontWeight: 700,
                        fontSize: "1.75rem",
                        transition: "color 0.25s ease",
                      }}
                    >
                      {profile?.name || "Không có tên"}
                    </h4>

                    <ul
                      className="list-inline mb-0 d-flex align-items-center flex-wrap justify-content-sm-start justify-content-center gap-4 mt-4"
                      style={{ listStyle: "none", padding: 0 }}
                    >
                      {/* Role */}
                      <li
                        className="list-inline-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "50px",
                            backgroundColor: "var(--danger-color)20",
                            color: "var(--danger-color)",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            gap: "0.4rem",
                          }}
                        >
                          <i className="bx bx-user" style={{ fontSize: "0.95rem" }}></i>
                          {profile?.roles?.[0] || "USER"}
                        </span>
                      </li>

                      {/* School */}
                      <li
                        className="list-inline-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            color: "var(--text-light)",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                            transition: "color 0.25s ease",
                          }}
                        >
                          <i
                            className="fa fa-school"
                            style={{
                              fontSize: "0.95rem",
                              color: "var(--primary-color)",
                            }}
                          ></i>
                          School: {profile?.school || "Không rõ"}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Friend Status Buttons */}
                  {!isOwner && (
                    <div
                      className="d-flex align-items-center gap-2 mb-1"
                      style={{
                        minHeight: "32px",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {loadingStatus ? (
                        <button
                          className="btn btn-sm px-3"
                          disabled
                          style={{
                            background: "var(--surface-alt)",
                            color: "var(--text-muted)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "12px",
                            fontWeight: 600,
                            cursor: "not-allowed",
                            opacity: 0.6,
                          }}
                        >
                          <i
                            className="bx bx-loader-alt bx-spin"
                            style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                          ></i>
                          Checking…
                        </button>
                      ) : status === "FRIEND" ? (
                        <button
                          className="btn btn-sm px-3 d-flex align-items-center"
                          disabled
                          style={{
                            background: "var(--success-color)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            fontWeight: 600,
                            minWidth: "120px",
                            justifyContent: "center",
                            cursor: "default",
                          }}
                          title="You are friends"
                        >
                          <i
                            className="bx bx-user-check"
                            style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                          ></i>
                          Friend
                        </button>
                      ) : status === "REQUESTED" ? (
                        <>
                          <button
                            className="btn btn-sm px-3 d-flex align-items-center"
                            disabled
                            style={{
                              background: "var(--surface-alt)",
                              color: "var(--text-muted)",
                              border: "2px solid var(--border-color)",
                              borderRadius: "12px",
                              fontWeight: 600,
                              minWidth: "120px",
                              justifyContent: "center",
                              cursor: "default",
                              opacity: 0.7,
                            }}
                            title="Friend request sent"
                          >
                            <i
                              className="bx bx-time"
                              style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                            ></i>
                            Requested
                          </button>
                          {requestId && (
                            <button
                              className="btn btn-sm px-3 d-flex align-items-center"
                              onClick={handleCancel}
                              disabled={acting}
                              style={{
                                background: "transparent",
                                color: "var(--danger-color)",
                                border: "2px solid var(--danger-color)",
                                borderRadius: "12px",
                                fontWeight: 600,
                                cursor: acting ? "not-allowed" : "pointer",
                                opacity: acting ? 0.6 : 1,
                                transition: "all 0.25s ease",
                              }}
                              title="Cancel request"
                              onMouseEnter={(e) => {
                                if (!acting) {
                                  e.currentTarget.style.background = "var(--danger-color)";
                                  e.currentTarget.style.color = "white";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!acting) {
                                  e.currentTarget.style.background = "transparent";
                                  e.currentTarget.style.color = "var(--danger-color)";
                                }
                              }}
                            >
                              {acting ? (
                                <>
                                  <i
                                    className="bx bx-loader-alt bx-spin"
                                    style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                                  ></i>
                                  Canceling…
                                </>
                              ) : (
                                <>
                                  <i
                                    className="bx bx-x"
                                    style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                                  ></i>
                                  Cancel
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : status === "INCOMING" ? (
                        <>
                          <button
                            className="btn btn-sm px-3 d-flex align-items-center"
                            onClick={handleAccept}
                            disabled={acting}
                            style={{
                              background: "var(--success-color)",
                              color: "white",
                              border: "none",
                              borderRadius: "12px",
                              fontWeight: 600,
                              cursor: acting ? "not-allowed" : "pointer",
                              opacity: acting ? 0.7 : 1,
                              transition: "all 0.25s ease",
                              minWidth: "120px",
                              justifyContent: "center",
                              display: "flex",
                              alignItems: "center",
                            }}
                            onMouseEnter={(e) => {
                              if (!acting) {
                                e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!acting) {
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                              }
                            }}
                          >
                            {acting ? (
                              <>
                                <i
                                  className="bx bx-loader-alt bx-spin"
                                  style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                                ></i>
                                Accepting…
                              </>
                            ) : (
                              <>
                                <i
                                  className="bx bx-check"
                                  style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                                ></i>
                                Accept
                              </>
                            )}
                          </button>

                          <button
                            className="btn btn-sm px-3 d-flex align-items-center"
                            onClick={handleDecline}
                            disabled={acting}
                            style={{
                              background: "transparent",
                              color: "var(--danger-color)",
                              border: "2px solid var(--danger-color)",
                              borderRadius: "12px",
                              fontWeight: 600,
                              cursor: acting ? "not-allowed" : "pointer",
                              opacity: acting ? 0.6 : 1,
                              transition: "all 0.25s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!acting) {
                                e.currentTarget.style.background = "var(--danger-color)";
                                e.currentTarget.style.color = "white";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!acting) {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "var(--danger-color)";
                              }
                            }}
                          >
                            <i
                              className="bx bx-x"
                              style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                            ></i>
                            Decline
                          </button>
                        </>
                      ) : (
                        // NONE - Connect
                        <button
                          className="btn btn-sm px-3 d-flex align-items-center"
                          onClick={handleConnect}
                          disabled={acting}
                          style={{
                            background: "var(--gradient-primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            fontWeight: 600,
                            cursor: acting ? "not-allowed" : "pointer",
                            opacity: acting ? 0.7 : 1,
                            transition: "all 0.25s ease",
                            minWidth: "120px",
                            justifyContent: "center",
                            display: "flex",
                            alignItems: "center",
                          }}
                          aria-label="Send friend request"
                          onMouseEnter={(e) => {
                            if (!acting) {
                              e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!acting) {
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.transform = "translateY(0)";
                            }
                          }}
                        >
                          {acting ? (
                            <>
                              <i
                                className="bx bx-loader-alt bx-spin"
                                style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                              ></i>
                              Sending…
                            </>
                          ) : (
                            <>
                              <i
                                className="bx bx-user-plus"
                                style={{ marginRight: "0.5rem", fontSize: "0.95rem" }}
                              ></i>
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Zoom Modal */}
      {showAvatarModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            animation: "fadeIn 0.3s ease forwards",
          }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "90vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content border-0"
              style={{
                background: "transparent",
                boxShadow: "none",
              }}
            >
              <div className="modal-body p-0 d-flex justify-content-center align-items-center">
                <img
                  src={avatarSrc}
                  alt={profile?.name || "User avatar"}
                  className="rounded-circle"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                    animation: "zoomIn 0.3s ease forwards",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = unknownAvatar;
                  }}
                />
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="btn btn-icon rounded-circle position-absolute top-0 end-0 m-3"
                onClick={handleCloseModal}
                aria-label="Close"
                style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid white",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "1.25rem",
                  transition: "all 0.25s ease",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default HeaderProfile;