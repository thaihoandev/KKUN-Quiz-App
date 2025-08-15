import { useEffect, useMemo, useState } from "react";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { UserResponseDTO } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";
import {
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "@/services/userService";

type FriendshipStatus = "NONE" | "REQUESTED" | "INCOMING" | "FRIEND";

interface HeaderProfileProps {
  profile: UserResponseDTO | null;
  onEditAvatar?: () => void; // optional: khi xem hồ sơ người khác, không cần truyền
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
      // giữ nguyên trạng thái hiện tại nếu lỗi
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    setStatus("NONE");
    setRequestId(null);
    // mỗi khi đổi user xem, re-check
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
          <div className="card mb-6 mt-3">
            <div className="user-profile-header-banner" />
            <div className="user-profile-header d-flex flex-column flex-lg-row text-sm-start text-center mb-3">
              <div className="flex-shrink-0 mx-auto position-relative">
                <div
                  className="avatar avatar-xl rounded-circle overflow-hidden border border-3 border-white shadow-sm"
                  style={{ width: "140px", height: "140px", cursor: "pointer" }}
                  onClick={handleAvatarClick}
                >
                  <img
                    src={avatarSrc}
                    alt={profile?.name || "User avatar"}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      e.currentTarget.src = unknownAvatar;
                    }}
                  />
                </div>

                {/* Nút edit avatar: chỉ hiện khi là owner và có onEditAvatar */}
                {isOwner && onEditAvatar && (
                  <button
                    className="btn btn-icon btn-outline-primary btn-sm rounded-circle position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center"
                    style={{
                      transform: "translate(10%, 10%)",
                      width: "32px",
                      height: "32px",
                    }}
                    onClick={onEditAvatar}
                    title="Edit Avatar"
                    aria-label="Edit avatar"
                  >
                    <i className="icon-base bx bx-edit icon-sm" />
                  </button>
                )}
              </div>

              <div className="flex-grow-1 mt-3 mt-lg-5">
                <div className="d-flex align-items-md-end align-items-sm-start align-items-center justify-content-md-between justify-content-start mx-5 flex-md-row flex-column gap-4">
                  <div className="user-profile-info">
                    <h4 className="mb-2 mt-lg-7">{profile?.name || "Không có tên"}</h4>
                    <ul className="list-inline mb-0 d-flex align-items-center flex-wrap justify-content-sm-start justify-content-center gap-4 mt-4">
                      <li className="list-inline-item text-danger">
                        <i className="icon-base bx bx-user me-2 align-top" />
                        <span>{profile?.roles?.[0] || "USER"}</span>
                      </li>
                      <li className="list-inline-item">
                        <i className="icon-base fa fa-school me-2 align-top" />
                        <span className="fw-medium">School: {profile?.school || "Không rõ"}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nút quan hệ bạn bè: ẩn nếu là owner */}
                  {!isOwner && (
                    <div className="d-flex align-items-center gap-2 mb-1" style={{ minHeight: 32 }}>
                      {loadingStatus ? (
                        <button className="btn btn-outline-secondary btn-sm px-3" disabled>
                          Checking…
                        </button>
                      ) : status === "FRIEND" ? (
                        <button
                          className="btn btn-success btn-sm px-3 d-flex align-items-center"
                          disabled
                          style={{ minWidth: 120 }}
                          title="You are friends"
                        >
                          <i className="icon-base bx bx-user-check icon-sm me-2" />
                          Friend
                        </button>
                      ) : status === "REQUESTED" ? (
                        <>
                          <button
                            className="btn btn-outline-secondary btn-sm px-3 d-flex align-items-center"
                            disabled
                            style={{ minWidth: 120 }}
                            title="Friend request sent"
                          >
                            <i className="icon-base bx bx-time icon-sm me-2" />
                            Requested
                          </button>
                          {requestId && (
                            <button
                              className="btn btn-outline-danger btn-sm px-3 d-flex align-items-center"
                              onClick={handleCancel}
                              disabled={acting}
                              title="Cancel request"
                            >
                              {acting ? (
                                <>
                                  <i className="bx bx-loader-alt bx-spin me-2" />
                                  Canceling…
                                </>
                              ) : (
                                <>
                                  <i className="icon-base bx bx-x icon-sm me-2" />
                                  Cancel
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : status === "INCOMING" ? (
                        <>
                          <button
                            className="btn btn-success btn-sm px-3 d-flex align-items-center"
                            onClick={handleAccept}
                            disabled={acting}
                          >
                            {acting ? (
                              <>
                                <i className="bx bx-loader-alt bx-spin me-2" />
                                Accepting…
                              </>
                            ) : (
                              <>
                                <i className="icon-base bx bx-check icon-sm me-2" />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm px-3 d-flex align-items-center"
                            onClick={handleDecline}
                            disabled={acting}
                          >
                            <i className="icon-base bx bx-x icon-sm me-2" />
                            Decline
                          </button>
                        </>
                      ) : (
                        // NONE
                        <button
                          className="btn btn-primary btn-sm px-3 d-flex align-items-center"
                          onClick={handleConnect}
                          disabled={acting}
                          aria-label="Send friend request"
                          style={{ minWidth: 120 }}
                        >
                          {acting ? (
                            <>
                              <i className="bx bx-loader-alt bx-spin me-2" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <i className="icon-base bx bx-user-plus icon-sm me-2" />
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
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={handleCloseModal}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "90vw" }}>
            <div className="modal-content border-0 bg-transparent">
              <div className="modal-body p-0 d-flex justify-content-center align-items-center">
                <img
                  src={avatarSrc}
                  alt={profile?.name || "User avatar"}
                  className="rounded-circle shadow-lg"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    imageRendering: "auto",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = unknownAvatar;
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-icon btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-3"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                <i className="icon-base bx bx-x icon-md" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderProfile;
