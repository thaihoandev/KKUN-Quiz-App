import UserDropdown from "../dropdowns/UserDropdown";
import NotificationHeader from "../NotificationHeader";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface NavbarProps {
  profile: { userId: string; name?: string; avatar?: string } | null;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
    document.body.classList.toggle("dark-theme");
  };

  return (
    <nav
      className="navbar d-flex align-items-center justify-content-between px-4 py-2 shadow-sm"
      style={{
        position: "sticky", // 👈 Dính trên cùng content
        top: "0",
        zIndex: 1000,
        margin: "8px 16px 0 16px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      {/* Left side */}
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-primary d-flex align-items-center"
          onClick={() => navigate("/join-game")}
        >
          <i className="bx bx-joystick me-2"></i> Play
        </button>

        <button
          className="btn btn-outline-primary d-flex align-items-center"
          onClick={() => navigate("/articles")}
        >
          <i className="bx bx-news me-2"></i> Articles
        </button>

        {profile && (
          <button
            className="btn btn-outline-secondary d-flex align-items-center"
            onClick={() => navigate("/chat")}
          >
            <i className="bx bx-chat me-2"></i> Chat
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="d-flex align-items-center gap-3">

        {profile && <NotificationHeader profile={profile} />}

        {profile ? (
          <UserDropdown profile={profile} />
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="btn btn-outline-primary rounded-pill px-3"
          >
            <i className="bx bx-log-in me-1"></i> Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
