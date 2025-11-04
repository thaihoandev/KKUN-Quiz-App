import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/logo/kkun-quiz-logo.png";

interface Profile {
  userId?: string;
}

const SidebarMain: React.FC<{ profile?: Profile }> = ({ profile }) => {
  const [activeMenuItem, setActiveMenuItem] = useState<string>("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setActiveMenuItem(location.pathname);
  }, [location.pathname]);

  const handleMenuItemClick = (path: string) => setActiveMenuItem(path);
  const isActive = (path: string) => activeMenuItem === path;

  const getNavLinkClass = ({ isActive: active }: { isActive: boolean }) =>
    `menu-link ${active ? "active" : ""}`;

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-white d-flex flex-column w-100 h-100 border-end"
      style={{ overflowY: "auto" }}
    >
      {/* Logo */}
      <div className="app-brand demo d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
        <Link to="/" className="d-flex align-items-center text-decoration-none">
          <img src={logo} alt="Logo" style={{ width: 40, height: 40 }} />
          <span className="app-brand-text fw-bold ms-2 fs-5 text-dark">KKUN</span>
        </Link>
      </div>

      {/* Menu */}
      <ul className="menu-inner py-3 px-2 flex-grow-1">
        {/* === GENERAL === */}
        <li className={`menu-item ${isActive("/") ? "active" : ""}`}>
          <Link to="/" className="menu-link" onClick={() => handleMenuItemClick("/")}>
            <i className="menu-icon bx bx-home-smile"></i>
            <div>Home</div>
          </Link>
        </li>

        <li className={`menu-item ${isActive("/posts") ? "active" : ""}`}>
          <Link to="/posts" className="menu-link" onClick={() => handleMenuItemClick("/posts")}>
            <i className="menu-icon bx bx-news"></i>
            <div>Posts</div>
          </Link>
        </li>

        {/* === INTERACTION === */}
        <li className="menu-header small mt-4">
          <span className="menu-header-text text-primary fw-bold">
            <i className="bx bx-bolt me-1 text-warning"></i> Interaction
          </span>
        </li>

        <li className={`menu-item ${isActive("/join-game") ? "active" : ""}`}>
          <Link
            to="/join-game"
            className="menu-link"
            onClick={() => handleMenuItemClick("/join-game")}
          >
            <i className="menu-icon bx bx-joystick text-primary"></i>
            <div className="fw-semibold text-primary">Join Game</div>
          </Link>
        </li>

        {profile ? (
          <>
            {/* === ACCOUNT === */}
            <li className="menu-header small mt-4">
              <span className="menu-header-text">My Account</span>
            </li>

            <li className={`menu-item ${isActive(`/profile/${profile.userId}`) ? "active" : ""}`}>
              <NavLink
                to={`/profile/${profile.userId}`}
                end
                className={getNavLinkClass}
              >
                <i className="menu-icon bx bx-user-circle"></i>
                <div>My Profile</div>
              </NavLink>
            </li>

            <li className={`menu-item ${isActive("/achievements") ? "active" : ""}`}>
              <Link to="/achievements" className="menu-link">
                <i className="menu-icon bx bx-trophy"></i>
                <div>Achievements</div>
              </Link>
            </li>

            <li className={`menu-item ${isActive("/friends") ? "active" : ""}`}>
              <Link to="/friends" className="menu-link">
                <i className="menu-icon bx bx-group"></i>
                <div>Friends</div>
              </Link>
            </li>

            <li className={`menu-item ${isActive("/chat") ? "active" : ""}`}>
              <Link to="/chat" className="menu-link" onClick={() => handleMenuItemClick("/chat")}>
                <i className="menu-icon bx bx-chat"></i>
                <div className="fw-semibold">Chat</div>
              </Link>
            </li>

            {/* === ARTICLES === */}
            <li className="menu-header small mt-4">
              <span className="menu-header-text">Articles</span>
            </li>

            <li className={`menu-item ${isActive("/articles") ? "active" : ""}`}>
              <Link to="/articles" className="menu-link">
                <i className="menu-icon bx bx-news"></i>
                <div>Browse Articles</div>
              </Link>
            </li>
          </>
        ) : (
          <>
            {/* === GUEST === */}
            <li className="menu-header small mt-4">
              <span className="menu-header-text">Get Started</span>
            </li>
            <li className="menu-item">
              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary w-100 mb-2"
              >
                <i className="bx bx-log-in me-2"></i>Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="btn btn-outline-primary w-100"
              >
                <i className="bx bx-user-plus me-2"></i>Register
              </button>
            </li>
          </>
        )}
      </ul>
    </aside>
  );
};

export default SidebarMain;