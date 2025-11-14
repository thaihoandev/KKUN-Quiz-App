import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarMain from "@/components/sidebars/SidebarMain";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbars/Navbar";
import { useAuthStore } from "@/store/authStore";
import "bootstrap/dist/css/bootstrap.min.css";

const MainLayout: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [isDark, setIsDark] = useState(false);
  const [profile, setProfile] = useState<any>(null);

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

  return (
    <div
      className="vh-100 d-flex"
      style={{
        background: "var(--background-color)",
        color: "var(--text-color)",
        transition: "background 0.4s ease, color 0.25s ease",
      }}
    >
      {/* === SIDEBAR === */}
      <div>
        <SidebarMain profile={profile ?? user} />
      </div>

      {/* === MAIN CONTENT === */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          height: "100vh",
          background: "var(--background-color)",
          transition: "background 0.4s ease",
        }}
      >
        {/* Navbar */}
        <header
          style={{
            transition: "background 0.25s ease, border-color 0.25s ease",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Navbar profile={profile ?? user} />
        </header>

        {/* Main Content */}
        <main
          className="flex-grow-1 overflow-auto p-4 pb-0"
          style={{
            scrollBehavior: "smooth",
            background: "var(--background-color)",
            transition: "background 0.4s ease",
          }}
        >
          <div className="container-fluid">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Scrollbar Styling */}
    </div>
  );
};

export default MainLayout;
