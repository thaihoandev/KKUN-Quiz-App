import { formatDateOnly } from "@/utils/dateUtils";
import { UserResponseDTO } from "@/interfaces";

interface ProfileTabProps {
  profile: UserResponseDTO | null;
  onEditProfile: () => void;
}

const ProfileTab = ({ profile, onEditProfile }: ProfileTabProps) => {
  return (
    <div className="row g-4">
      <div className="col-xl-4 col-lg-5 col-md-6 col-sm-12">
        {/* About User */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body position-relative">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="card-text text-uppercase text-body-secondary small">
                About
              </small>
              <button
                className="btn btn-icon btn-outline-primary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
                onClick={onEditProfile}
                title="Edit Profile"
                aria-label="Edit profile"
              >
                <i className="icon-base bx bx-edit icon-sm"></i>
              </button>
            </div>
            <ul className="list-unstyled my-3 py-1">
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-user me-2"></i>
                <span className="fw-medium me-2">Full Name:</span>
                <span>{profile?.name || "N/A"}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-flag me-2"></i>
                <span className="fw-medium me-2">Email:</span>
                <span>{profile?.email || "N/A"}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-building me-2"></i>
                <span className="fw-medium me-2">School:</span>
                <span>{profile?.school || "N/A"}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-detail me-2"></i>
                <span className="fw-medium me-2">Created at:</span>
                <span>{profile?.createdAt ? formatDateOnly(profile.createdAt) : "N/A"}</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Profile Overview */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <small className="card-text text-uppercase text-body-secondary small">
              Overview
            </small>
            <div className="row row-cols-1 row-cols-md-2 g-3 p-3">
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body text-center">
                    <h6 className="card-title">Quizzes Taken</h6>
                    <p className="card-text text-muted">Coming soon!</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body text-center">
                    <h6 className="card-title">Achievements</h6>
                    <p className="card-text text-muted">Coming soon!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-8 col-lg-7 col-md-6 col-sm-12">
        {/* Recent Activity */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <small className="card-text text-uppercase text-body-secondary small">
              Recent Activity
            </small>
            <div className="row row-cols-1 row-cols-md-2 g-3 p-3">
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body">
                    <h6 className="card-title">Quiz: Math Basics</h6>
                    <p className="card-text text-muted">Completed on {formatDateOnly(new Date())}</p>
                    <p className="card-text">Score: Coming soon!</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body">
                    <h6 className="card-title">Quiz: Science Trivia</h6>
                    <p className="card-text text-muted">Completed on {formatDateOnly(new Date())}</p>
                    <p className="card-text">Score: Coming soon!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Recommended Quizzes */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <small className="card-text text-uppercase text-body-secondary small">
              Recommended Quizzes
            </small>
            <div className="row row-cols-1 row-cols-md-2 g-3 p-3">
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body">
                    <h6 className="card-title">History Challenge</h6>
                    <p className="card-text text-muted">Difficulty: Medium</p>
                    <button className="btn btn-outline-primary btn-sm">Take Quiz</button>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body">
                    <h6 className="card-title">Geography Trivia</h6>
                    <p className="card-text text-muted">Difficulty: Easy</p>
                    <button className="btn btn-outline-primary btn-sm">Take Quiz</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;