import { useState } from "react";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg"; // Default avatar image
import { UserResponseDTO } from "@/interfaces";

interface HeaderProfileProps {
  profile: UserResponseDTO | null;
  onEditAvatar: () => void;
}

const HeaderProfile = ({ profile, onEditAvatar }: HeaderProfileProps) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Fallback avatar logic with nullish coalescing
  const avatarSrc = profile?.avatar?.trim() || unknownAvatar;

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleCloseModal = () => {
    setShowAvatarModal(false);
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="card mb-6 mt-3">
            <div className="user-profile-header-banner"></div>
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
                    style={{ imageRendering: "auto" }}
                    onError={(e) => {
                      e.currentTarget.src = unknownAvatar;
                    }}
                  />
                </div>
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
                  <i className="icon-base bx bx-edit icon-sm"></i>
                </button>
              </div>
              <div className="flex-grow-1 mt-3 mt-lg-5">
                <div className="d-flex align-items-md-end align-items-sm-start align-items-center justify-content-md-between justify-content-start mx-5 flex-md-row flex-column gap-4">
                  <div className="user-profile-info">
                    <h4 className="mb-2 mt-lg-7">{profile?.name || "Không có tên"}</h4>
                    <ul className="list-inline mb-0 d-flex align-items-center flex-wrap justify-content-sm-start justify-content-center gap-4 mt-4">
                      <li className="list-inline-item text-danger">
                        <i className="icon-base bx bx-user me-2 align-top"></i>
                        <span>{profile?.roles?.[0] || "USER"}</span>
                      </li>
                      <li className="list-inline-item">
                        <i className="icon-base fa fa-school me-2 align-top"></i>
                        <span className="fw-medium">School: {profile?.school || "Không rõ"}</span>
                      </li>
                    </ul>
                  </div>
                  <a
                    href="#"
                    className="btn btn-primary btn-sm mb-1 px-3 d-flex align-items-center"
                    style={{ minWidth: "120px" }}
                  >
                    <i className="icon-base bx bx-user-check icon-sm me-2"></i>
                    Connected
                  </a>
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
                <i className="icon-base bx bx-x icon-md"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderProfile;