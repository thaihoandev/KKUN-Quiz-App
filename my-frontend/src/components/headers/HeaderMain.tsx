import UserDropdown from "../dropdowns/UserDropdown";
import NotificationHeader from "../NotificationHeader";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/img/logo/kkun-quiz-logo.png";

interface NavbarProps {
  profile: { userId: string; name?: string; avatar?: string } | null;
}

const HeaderMain: React.FC<NavbarProps> = ({ profile }) => {
  const navigate = useNavigate();

  return (
    <header className="w-100" style={{ backgroundColor: "#fff"}}>
      {/* Full-width navbar */}
      <nav className="navbar navbar-expand-xl align-items-center bg-navbar-theme shadow-sm w-100">
        <div className="container-fluid">
          {/* 🏷️ Logo (thay cho SearchBar) */}
          <button
            className="navbar-brand border-0 bg-transparent p-0 d-flex align-items-center"
            onClick={() => navigate("/")}
            aria-label="Go to homepage"
          >
            <img
              src={logo}              // 👉 đổi đường dẫn nếu cần
              alt="Logo"
              className="me-2"
              style={{ height: 28 }}
            />
            <span className="fw-semibold">System</span>
          </button>

          {/* 🔔 Notifications & 👤 User - nằm bên phải */}
          <ul className="navbar-nav flex-row align-items-center ms-auto">
            {profile ? (
              <>
                <NotificationHeader profile={profile} />
                <UserDropdown profile={profile} />
              </>
            ) : (
              <li className="nav-item">
                <button
                  onClick={() => navigate("/login")}
                  className="btn btn-outline-primary"
                >
                  Login
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default HeaderMain;
