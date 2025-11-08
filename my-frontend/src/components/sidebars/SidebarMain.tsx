import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/logo/kkun-quiz-logo.png";

interface Profile {
  userId?: string;
}

const SidebarMain: React.FC<{ profile?: Profile }> = ({ profile }) => {
  const [activeMenuItem, setActiveMenuItem] = useState<string>("");
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
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

  // Track active menu item
  useEffect(() => {
    setActiveMenuItem(location.pathname);
  }, [location.pathname]);

  const handleMenuItemClick = (path: string) => setActiveMenuItem(path);
  const isActive = (path: string) => activeMenuItem === path;

  const menuItemStyles = (active: boolean) => ({
    color: active ? "white" : "var(--text-light)",
    background: active ? "var(--gradient-primary)" : "transparent",
    padding: "0.75rem 1rem",
    marginBottom: "0.5rem",
    transition: "all 0.25s ease",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    cursor: "pointer",
  });

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu d-flex flex-column w-100 h-100"
      style={{
        width: "280px",
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        background: "var(--surface-color)",
        borderRadius:"12px",
        border: "none",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      {/* Logo Section */}
      <div
        className="app-brand demo d-flex align-items-center justify-content-between px-4 py-4"
        style={{
          borderColor: "var(--border-color)",
          transition: "border-color 0.25s ease",
        }}
      >
        <Link
          to="/"
          className="d-flex align-items-center text-decoration-none"
          style={{
            transition: "opacity 0.25s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <img src={logo} alt="Logo" style={{ width: "40px", height: "40px" }} />
          <span
            className="fw-bold ms-2 fs-5"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              transition: "all 0.25s ease",
            }}
          >
            KKUN
          </span>
        </Link>
      </div>

      {/* Menu Items */}
      <ul className="menu-inner py-3 px-3 flex-grow-1" style={{ listStyle: "none", margin: 0 }}>
        {/* === GENERAL === */}
        <li>
          <Link
            to="/"
            className="d-flex align-items-center text-decoration-none"
            style={menuItemStyles(isActive("/"))}
            onClick={() => handleMenuItemClick("/")}
            onMouseEnter={(e) => {
              if (!isActive("/")) {
                e.currentTarget.style.background = "var(--surface-alt)";
                e.currentTarget.style.color = "var(--primary-color)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive("/")) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-light)";
              }
            }}
          >
            <i className="bx bx-home-smile" style={{ fontSize: "1.25rem" }}></i>
            <span style={{ fontWeight: 500 }}>Home</span>
          </Link>
        </li>

        <li>
          <Link
            to="/posts"
            className="d-flex align-items-center text-decoration-none"
            style={menuItemStyles(isActive("/posts"))}
            onClick={() => handleMenuItemClick("/posts")}
            onMouseEnter={(e) => {
              if (!isActive("/posts")) {
                e.currentTarget.style.background = "var(--surface-alt)";
                e.currentTarget.style.color = "var(--primary-color)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive("/posts")) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-light)";
              }
            }}
          >
            <i className="bx bx-news" style={{ fontSize: "1.25rem" }}></i>
            <span style={{ fontWeight: 500 }}>Posts</span>
          </Link>
        </li>

        {/* === INTERACTION === */}
        <li style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--primary-color)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="bx bx-bolt" style={{ color: "var(--warning-color)" }}></i>
            Interaction
          </span>
        </li>

        <li>
          <Link
            to="/join-game"
            className="d-flex align-items-center text-decoration-none"
            style={{
              ...menuItemStyles(isActive("/join-game")),
              color: isActive("/join-game") ? "white" : "var(--primary-color)",
              fontWeight: 600,
            }}
            onClick={() => handleMenuItemClick("/join-game")}
            onMouseEnter={(e) => {
              if (!isActive("/join-game")) {
                e.currentTarget.style.background = "var(--surface-alt)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive("/join-game")) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <i
              className="bx bx-joystick"
              style={{
                fontSize: "1.25rem",
                color: isActive("/join-game") ? "white" : "var(--primary-color)",
              }}
            ></i>
            <span>Join Game</span>
          </Link>
        </li>

        {profile ? (
          <>
            {/* === ACCOUNT === */}
            <li style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                }}
              >
                My Account
              </span>
            </li>

            <li>
              <Link
                to={`/profile/${profile.userId}`}
                className="d-flex align-items-center text-decoration-none"
                style={menuItemStyles(isActive(`/profile/${profile.userId}`))}
                onClick={() => handleMenuItemClick(`/profile/${profile.userId}`)}
                onMouseEnter={(e) => {
                  if (!isActive(`/profile/${profile.userId}`)) {
                    e.currentTarget.style.background = "var(--surface-alt)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(`/profile/${profile.userId}`)) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-light)";
                  }
                }}
              >
                <i className="bx bx-user-circle" style={{ fontSize: "1.25rem" }}></i>
                <span style={{ fontWeight: 500 }}>My Profile</span>
              </Link>
            </li>

            <li>
              <Link
                to="/achievements"
                className="d-flex align-items-center text-decoration-none"
                style={menuItemStyles(isActive("/achievements"))}
                onClick={() => handleMenuItemClick("/achievements")}
                onMouseEnter={(e) => {
                  if (!isActive("/achievements")) {
                    e.currentTarget.style.background = "var(--surface-alt)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/achievements")) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-light)";
                  }
                }}
              >
                <i className="bx bx-trophy" style={{ fontSize: "1.25rem" }}></i>
                <span style={{ fontWeight: 500 }}>Achievements</span>
              </Link>
            </li>

            <li>
              <Link
                to="/friends"
                className="d-flex align-items-center text-decoration-none"
                style={menuItemStyles(isActive("/friends"))}
                onClick={() => handleMenuItemClick("/friends")}
                onMouseEnter={(e) => {
                  if (!isActive("/friends")) {
                    e.currentTarget.style.background = "var(--surface-alt)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/friends")) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-light)";
                  }
                }}
              >
                <i className="bx bx-group" style={{ fontSize: "1.25rem" }}></i>
                <span style={{ fontWeight: 500 }}>Friends</span>
              </Link>
            </li>

            <li>
              <Link
                to="/chat"
                className="d-flex align-items-center text-decoration-none"
                style={{
                  ...menuItemStyles(isActive("/chat")),
                  fontWeight: isActive("/chat") ? 600 : 500,
                }}
                onClick={() => handleMenuItemClick("/chat")}
                onMouseEnter={(e) => {
                  if (!isActive("/chat")) {
                    e.currentTarget.style.background = "var(--surface-alt)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/chat")) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-light)";
                  }
                }}
              >
                <i className="bx bx-chat" style={{ fontSize: "1.25rem" }}></i>
                <span>Chat</span>
              </Link>
            </li>

            {/* === ARTICLES === */}
            <li style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                }}
              >
                Articles
              </span>
            </li>

            <li>
              <Link
                to="/articles"
                className="d-flex align-items-center text-decoration-none"
                style={menuItemStyles(isActive("/articles"))}
                onClick={() => handleMenuItemClick("/articles")}
                onMouseEnter={(e) => {
                  if (!isActive("/articles")) {
                    e.currentTarget.style.background = "var(--surface-alt)";
                    e.currentTarget.style.color = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/articles")) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-light)";
                  }
                }}
              >
                <i className="bx bx-news" style={{ fontSize: "1.25rem" }}></i>
                <span style={{ fontWeight: 500 }}>Browse Articles</span>
              </Link>
            </li>
          </>
        ) : (
          <>
            {/* === GUEST === */}
            <li style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                }}
              >
                Get Started
              </span>
            </li>

            <li className="d-flex flex-column gap-2" style={{ marginTop: "0.75rem" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "var(--gradient-primary)",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                <i className="bx bx-log-in"></i>
                <span>Login</span>
              </button>

              <button
                onClick={() => navigate("/register")}
                style={{
                  background: "transparent",
                  color: "var(--primary-color)",
                  border: "2px solid var(--primary-color)",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.25s ease",
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
                <i className="bx bx-user-plus"></i>
                <span>Register</span>
              </button>
            </li>
          </>
        )}
      </ul>

    </aside>
  );
};

export default SidebarMain;