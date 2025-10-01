import React, { useEffect, useState, MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/logo/kkun-quiz-logo.png";
import JoinRoomBox from "../boxes/JoinRoomBox";

interface Profile {
  userId?: string;
}

const SidebarMain: React.FC<{ profile?: Profile }> = ({ profile }) => {
  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string>("");
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Collapsed class on body
  useEffect(() => {
    if (menuCollapsed && !isHovered) {
      document.body.classList.add("layout-menu-collapsed");
    } else {
      document.body.classList.remove("layout-menu-collapsed");
    }
  }, [menuCollapsed, isHovered]);

  // Active item theo route
  useEffect(() => {
    const currentPath = location.pathname;
    if (activeMenuItem !== currentPath) setActiveMenuItem(currentPath);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMenuItemClick = (path: string) => setActiveMenuItem(path);

  const toggleSubmenu = (e: MouseEvent<HTMLAnchorElement>, submenuId: string) => {
    e.preventDefault();
    setOpenSubmenus((prev) =>
      prev.includes(submenuId) ? prev.filter((id) => id !== submenuId) : [...prev, submenuId]
    );
  };

  const toggleSidebar = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMenuCollapsed(!menuCollapsed);
  };

  const handleMouseEnter = () => menuCollapsed && setIsHovered(true);
  const handleMouseLeave = () => menuCollapsed && setIsHovered(false);

  const isActive = (path: string) => activeMenuItem === path;
  const isSubmenuOpen = (submenuId: string) => openSubmenus.includes(submenuId);
  const getChevronIcon = () => (menuCollapsed ? "bx-chevron-right" : "bx-chevron-left");

  const isCollapsedAndNotHovered = menuCollapsed && !isHovered;
  const isSettingsOpen =
    isSubmenuOpen("settings") ||
    location.pathname.includes("/settings") ||
    location.pathname.includes("/change-password");

  return (
    <aside
      id="layout-menu"
      className={`layout-menu menu-vertical menu ${isCollapsedAndNotHovered ? "collapsed" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="app-brand demo">
        <a href="/" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img
              src={logo}
              style={{ width: "40px", height: "40px" }}
              alt="Logo"
              className="h-10 w-auto"
            />
          </span>
        </a>
        <span className="app-brand-text demo menu-text fw-bold ms-2">KKUN</span>
        <a href="#" onClick={toggleSidebar} className="layout-menu-toggle menu-link text-large ms-auto">
          <i className={`icon-base bx ${getChevronIcon()}`}></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      {/* Khi thu gọn: nút mở nhanh */}
      {isCollapsedAndNotHovered && (
        <div className="px-2 py-3 text-center">
          <button
            className="btn btn-primary btn-sm rounded-circle"
            type="button"
            title="Join Room"
            onClick={() => setMenuCollapsed(false)}
          >
            <i className="bx bx-plus"></i>
          </button>
        </div>
      )}

      <ul className="menu-inner py-1">
        <li className={`menu-item ${isActive("/") ? "active" : ""}`}>
          <Link to="/" className="menu-link" onClick={() => handleMenuItemClick("/")}>
            <i className="menu-icon icon-base bx bx-home-smile"></i>
            <div data-i18n="Home">Home</div>
          </Link>
        </li>

        <li className={`menu-item ${isActive("/posts") ? "active" : ""}`}>
          <Link to="/posts" className="menu-link" onClick={() => handleMenuItemClick("/posts")}>
            <i className="menu-icon icon-base bx bx-news"></i>
            <div data-i18n="Posts">Posts</div>
          </Link>
        </li>

        {profile ? (
          <>
            <li className="menu-header small">
              <span className="menu-header-text" data-i18n="Dashboard">Dashboard</span>
            </li>
            <li className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}>
              <Link to="/dashboard" className="menu-link" onClick={() => handleMenuItemClick("/dashboard")}>
                <i className="menu-icon icon-base bx bx-tachometer"></i>
                <div data-i18n="Dashboard">My Profile</div>
              </Link>
            </li>
            <li className={`menu-item ${isActive("/achievements") ? "active" : ""}`}>
              <Link to="/achievements" className="menu-link" onClick={() => handleMenuItemClick("/achievements")}>
                <i className="menu-icon icon-base bx bx-trophy"></i>
                <div data-i18n="Achievements">Achievements</div>
                <div className="badge text-bg-warning rounded-pill ms-auto">3</div>
              </Link>
            </li>

            <li className="menu-header small">
              <span className="menu-header-text" data-i18n="Settings">Settings</span>
            </li>
            <li className={`menu-item ${isSettingsOpen ? "open" : ""}`}>
              <a href="#" className="menu-link menu-toggle" onClick={(e) => toggleSubmenu(e, "settings")}>
                <i className="menu-icon icon-base bx bx-cog"></i>
                <div data-i18n="Settings">Settings</div>
              </a>
              <ul className={`menu-sub ${isSettingsOpen ? "open" : ""}`}>
                <li className={`menu-item ${isActive("/settings") ? "active" : ""}`}>
                  <Link to="/settings" className="menu-link" onClick={() => handleMenuItemClick("/settings")}>
                    <div data-i18n="Profile Settings">Profile Settings</div>
                  </Link>
                </li>
                <li className={`menu-item ${isActive("/change-password") ? "active" : ""}`}>
                  <Link to="/change-password" className="menu-link" onClick={() => handleMenuItemClick("/change-password")}>
                    <div data-i18n="Change Password">Change Password</div>
                  </Link>
                </li>
              </ul>
            </li>
          </>
        ) : (
          <>
            <li className="menu-header small">
              <span className="menu-header-text" data-i18n="Get Started">Get Started</span>
            </li>
            <li className="menu-item">
              <a
                href="#"
                className="menu-link"
                onClick={(e) => {
                  e.preventDefault();
                  const roomCodeInput = document.getElementById("roomCode") as HTMLInputElement | null;
                  if (roomCodeInput) roomCodeInput.focus();
                }}
              >
                <i className="menu-icon icon-base bx bx-door-open"></i>
                <div data-i18n="Quick Join">Quick Join Game</div>
              </a>
            </li>

            <li className="menu-header small">
              <span className="menu-header-text" data-i18n="Account">Account</span>
            </li>
            <li className="menu-item">
              <div className="px-3 py-2">
                <button onClick={() => navigate("/login")} className="btn btn-primary w-100 mb-2">
                  <i className="bx bx-log-in me-2"></i>Login
                </button>
                <button onClick={() => navigate("/register")} className="btn btn-outline-primary w-100">
                  <i className="bx bx-user-plus me-2"></i>Register
                </button>
              </div>
            </li>

            <li className="menu-header small">
              <span className="menu-header-text" data-i18n="About">About KKUN</span>
            </li>
            <li className="menu-item">
              <a href="#" className="menu-link" onClick={(e) => e.preventDefault()}>
                <i className="menu-icon icon-base bx bx-info-circle"></i>
                <div data-i18n="How to Play">How to Play</div>
              </a>
            </li>
            <li className="menu-item">
              <a href="#" className="menu-link" onClick={(e) => e.preventDefault()}>
                <i className="menu-icon icon-base bx bx-star"></i>
                <div data-i18n="Features">Features</div>
              </a>
            </li>
          </>
        )}
      </ul>
    </aside>
  );
};

export default SidebarMain;
