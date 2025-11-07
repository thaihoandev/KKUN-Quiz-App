import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";

const UserDropdown = ({ profile }: { profile: any }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // === DARK MODE STATE ===
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // 1. Kiểm tra localStorage
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      return saved === "dark";
    }
    // 2. Nếu chưa có → theo hệ thống
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // === ÁP DỤNG THEME ===
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (darkMode) {
      root.classList.add("dark-mode");
      body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark-mode");
      body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // === THEO DÕI THAY ĐỔI HỆ THỐNG (nếu người dùng thay đổi OS theme) ===
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Chỉ áp dụng nếu người dùng chưa tự chọn theme
      if (!localStorage.getItem("theme")) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();

      // ✅ đảm bảo navigate chạy sau khi Zustand update
      requestAnimationFrame(() => {
        navigate("/login", { replace: true });
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="nav-item navbar-dropdown dropdown-user dropdown">
      <a
        className="nav-link dropdown-toggle hide-arrow p-0"
        href="#"
        data-bs-toggle="dropdown"
      >
        <div className="avatar avatar-online">
          <img
            src={
              profile?.avatar && profile.avatar.trim() !== ""
                ? profile.avatar
                : unknownAvatar
            }
            className="rounded-circle"
            alt={profile?.name}
          />
        </div>
      </a>

      <ul
        className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2"
        style={{ minWidth: 240 }}
      >
        {/* === USER INFO === */}
        <li className="px-3 py-2">
          <div className="d-flex align-items-center">
            <div className="flex-shrink-0 me-3">
              <div className="avatar avatar-online">
                <img
                  src={
                    profile?.avatar && profile.avatar.trim() !== ""
                      ? profile.avatar
                      : unknownAvatar
                  }
                  className="w-px-40 h-auto rounded-circle"
                  alt={profile?.name || "Unknown"}
                />
              </div>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0 fw-semibold">{profile?.name || "Guest"}</h6>
              <small className="text-body-secondary">
                {profile?.username || "No username"}
              </small>
            </div>
          </div>
        </li>

        <li>
          <div className="dropdown-divider my-2"></div>
        </li>

        {/* === LINKS === */}
        <li>
          <Link className="dropdown-item py-2" to={`/profile/${profile?.userId}`}>
            <i className="bx bx-user me-3"></i> My Profile
          </Link>
        </li>

        <li>
          <Link className="dropdown-item py-2" to="/achievements">
            <i className="bx bx-trophy me-3"></i> Achievements
          </Link>
        </li>

        <li>
          <Link className="dropdown-item py-2" to="/settings">
            <i className="bx bx-cog me-3"></i> Settings
          </Link>
        </li>

        <li>
          <div className="dropdown-divider my-2"></div>
        </li>

        {/* === DARK MODE TOGGLE - CẢI TIẾN === */}
        <li>
          <div className="dropdown-item py-2 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i
                className={`bx text-warning me-3 fs-5 transition-all ${
                  darkMode ? "bx-moon" : "bx-sun"
                }`}
                style={{
                  transition: "transform 0.3s ease",
                  transform: darkMode ? "rotate(180deg)" : "rotate(0deg)",
                }}
              ></i>
              <span className="fw-medium">
                {darkMode ? "Dark Mode" : "Light Mode"}
              </span>
            </div>

            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                style={{
                  cursor: "pointer",
                  width: "42px",
                  height: "24px",
                }}
              />
            </div>
          </div>
        </li>

        <li>
          <div className="dropdown-divider my-2"></div>
        </li>

        {/* === LOGOUT === */}
        <li>
          <button
            className="dropdown-item py-2 text-danger fw-semibold d-flex align-items-center"
            onClick={handleLogout}
          >
            <i className="bx bx-power-off me-3"></i> Log Out
          </button>
        </li>
      </ul>
    </div>
  );
};

export default UserDropdown;