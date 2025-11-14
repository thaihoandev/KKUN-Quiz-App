import { useNavigate, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import UserDropdown from "../dropdowns/UserDropdown";
import NotificationHeader from "../NotificationHeader";
import logo from "@/assets/img/logo/kkun-quiz-logo.png";

interface NavbarProps {
  profile: { userId: string; name?: string; avatar?: string } | null;
}

const HeaderMain: React.FC<NavbarProps> = ({ profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Articles", path: "/articles" },
    { label: "Join Game", path: "/join-game" },
  ];

  if (profile) navItems.push({ label: "Dashboard", path: `/profile/${profile.userId}` });

  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm py-2 sticky-top"
      style={{
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div className="container-fluid px-4">
        {/* Logo */}
        <button
          className="navbar-brand border-0 p-0 d-flex align-items-center"
          onClick={() => navigate("/")}
          aria-label="Go to homepage"
          style={{
            background: "transparent",
            cursor: "pointer",
            transition: "opacity 0.25s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <img src={logo} alt="Logo" className="me-2" style={{ height: "32px" }} />
          <span
            className="fw-bold fs-5"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              transition: "all 0.25s ease",
            }}
          >
            KKUN Quiz
          </span>
        </button>

        {/* Toggle for mobile */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{
            background: "transparent",
            color: "var(--primary-color)",
          }}
        >
          <i className="bx bx-menu" style={{ fontSize: "1.5rem" }}></i>
        </button>

        {/* Navigation Links */}
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
                    className="nav-link position-relative fw-semibold"
                    style={{
                      fontSize: "0.95rem",
                      color: isActive ? "var(--primary-color)" : "var(--text-light)",
                      transition: "color 0.25s ease",
                      paddingBottom: "0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--primary-color)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--text-light)";
                      }
                    }}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="position-absolute start-0"
                        style={{
                          bottom: "0",
                          width: "100%",
                          height: "2px",
                          background: "var(--gradient-primary)",
                          borderRadius: "2px",
                          animation: "slideInUp 0.3s ease forwards",
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User / Notifications */}
        <ul
          className="navbar-nav flex-row align-items-center ms-auto gap-2"
          style={{
            transition: "all 0.25s ease",
          }}
        >
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
                  className="btn"
                  style={{
                    color: "var(--primary-color)",
                    border: "2px solid var(--primary-color)",
                    background: "transparent",
                    fontWeight: 600,
                    padding: "0.5rem 1rem",
                    borderRadius: "12px",
                    transition: "all 0.25s ease",
                    marginRight: "0.5rem",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--primary-color)";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--primary-color)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Login
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => navigate("/register")}
                  className="btn"
                  style={{
                    background: "var(--gradient-primary)",
                    color: "white",
                    fontWeight: 600,
                    padding: "0.5rem 1rem",
                    borderRadius: "12px",
                    border: "none",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
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
                  Register
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
};

export default HeaderMain;