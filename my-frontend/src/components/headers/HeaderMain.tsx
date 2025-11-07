import { useNavigate, useLocation, Link } from "react-router-dom";
import UserDropdown from "../dropdowns/UserDropdown";
import NotificationHeader from "../NotificationHeader";
import logo from "@/assets/img/logo/kkun-quiz-logo.png";

interface NavbarProps {
  profile: { userId: string; name?: string; avatar?: string } | null;
}

const HeaderMain: React.FC<NavbarProps> = ({ profile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Articles", path: "/articles" },
    { label: "Join Game", path: "/join-game" },
  ];

  // ✅ Thêm Dashboard nếu user đã đăng nhập
  if (profile) navItems.push({ label: "Dashboard", path: "/dashboard" });

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm py-2 sticky-top">
      <div className="container-fluid px-4">
        {/* 🏷️ Logo */}
        <button
          className="navbar-brand border-0 bg-transparent p-0 d-flex align-items-center"
          onClick={() => navigate("/")}
          aria-label="Go to homepage"
        >
          <img src={logo} alt="Logo" className="me-2" style={{ height: 32 }} />
          <span className="fw-bold text-primary fs-5">KKUN Quiz</span>
        </button>

        {/* 🔘 Toggle for mobile */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bx bx-menu fs-3 text-primary"></i>
        </button>

        {/* 🌐 Navigation Links */}
        <div className="collapse navbar-collapse justify-content-center" id="mainNavbar">
          <ul className="navbar-nav gap-3">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <li className="nav-item" key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link position-relative fw-semibold ${
                      isActive ? "text-primary active-link" : "text-dark"
                    }`}
                    style={{
                      fontSize: "1rem",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="position-absolute start-0 bottom-0 w-100"
                        style={{
                          height: "2px",
                          backgroundColor: "#0d6efd",
                          borderRadius: "2px",
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 👤 User / 🔔 Notifications */}
        <ul className="navbar-nav flex-row align-items-center ms-auto gap-2">
          {profile ? (
            <>
              <NotificationHeader profile={profile} />
              <UserDropdown profile={profile} />
            </>
          ) : (
            <>
              <li className="nav-item">
                <button
                  onClick={() => navigate("/login")}
                  className="btn btn-outline-primary me-2 px-3"
                >
                  Login
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => navigate("/register")}
                  className="btn btn-primary px-3"
                >
                  Register
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default HeaderMain;
