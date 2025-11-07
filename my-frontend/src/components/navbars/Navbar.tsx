import UserDropdown from "../dropdowns/UserDropdown";
import NotificationHeader from "../NotificationHeader";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface NavbarProps {
  profile: { userId: string; name?: string; avatar?: string } | null;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle("dark-mode");
  };

  return (
    <nav
      className="navbar d-flex align-items-center justify-content-between px-4 py-3"
      style={{
        position: "sticky",
        top: "0",
        zIndex: 1000,
        margin: "8px 16px 0 16px",
        borderRadius: "14px",
        background: isDark
          ? "rgba(30, 41, 59, 0.85)"
          : "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid var(--border-color)",
        transition: "all 0.25s ease",
      }}
    >
      {/* Left side - Action Buttons */}
      <div className="d-flex align-items-center gap-2" style={{ flexWrap: "wrap" }}>
        {/* Play Button */}
        <button
          className="btn"
          onClick={() => navigate("/join-game")}
          style={{
            background: "var(--gradient-primary)",
            color: "white",
            fontWeight: 600,
            padding: "0.625rem 1.25rem",
            borderRadius: "12px",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
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
          <i className="bx bx-joystick" style={{ fontSize: "1.1rem" }}></i>
          <span style={{ fontSize: "0.95rem" }}>Play</span>
        </button>

        {/* Articles Button */}
        <button
          className="btn"
          onClick={() => navigate("/articles")}
          style={{
            background: "var(--secondary-color)",
            color: "var(--primary-color)",
            fontWeight: 600,
            padding: "0.625rem 1.25rem",
            borderRadius: "12px",
            border: "2px solid var(--primary-color)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.25s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--primary-color)";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.boxShadow = "var(--hover-shadow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--secondary-color)";
            e.currentTarget.style.color = "var(--primary-color)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <i className="bx bx-news" style={{ fontSize: "1.1rem" }}></i>
          <span style={{ fontSize: "0.95rem" }}>Articles</span>
        </button>

        {/* Chat Button - Only for logged in users */}
        {profile && (
          <button
            className="btn"
            onClick={() => navigate("/chat")}
            style={{
              background: "transparent",
              color: "var(--text-light)",
              fontWeight: 600,
              padding: "0.625rem 1.25rem",
              borderRadius: "12px",
              border: "2px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.25s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-alt)";
              e.currentTarget.style.color = "var(--primary-color)";
              e.currentTarget.style.borderColor = "var(--primary-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-light)";
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            <i className="bx bx-chat" style={{ fontSize: "1.1rem" }}></i>
            <span style={{ fontSize: "0.95rem" }}>Chat</span>
          </button>
        )}
      </div>

      {/* Right side - Notifications & Profile */}
      <div
        className="d-flex align-items-center gap-3"
        style={{
          marginLeft: "auto",
          transition: "all 0.25s ease",
        }}
      >

        {/* Notifications - Only for logged in users */}
        {profile && <NotificationHeader profile={profile} />}

        {/* User Dropdown or Login */}
        {profile ? (
          <UserDropdown profile={profile} />
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="btn"
            style={{
              background: "var(--gradient-primary)",
              color: "white",
              fontWeight: 600,
              padding: "0.625rem 1.25rem",
              borderRadius: "25px",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
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
            <i className="bx bx-log-in" style={{ fontSize: "1.1rem" }}></i>
            <span style={{ fontSize: "0.95rem" }}>Login</span>
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .navbar {
            flex-wrap: wrap;
            gap: 1rem;
          }

          .navbar > div {
            width: 100%;
            justify-content: center;
          }

          .navbar > div:first-child {
            width: 100%;
          }

          .navbar > div:last-child {
            width: 100%;
            margin-left: 0;
            justify-content: center;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;