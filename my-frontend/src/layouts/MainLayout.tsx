import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarMain from "@/components/sidebars/SidebarMain";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbars/Navbar";
import { useAuthStore } from "@/store/authStore";
import "bootstrap/dist/css/bootstrap.min.css";

const MainLayout: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const ensureMe = useAuthStore((s) => s.ensureMe);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await ensureMe();
        if (me) setProfile(me);
      } catch (err) {
        console.warn("Không thể tải thông tin người dùng:", err);
      }
    };
    loadUser();
  }, [ensureMe]);

  return (
    <div className="vh-100 d-flex">
      {/* === SIDEBAR === */}
      <div
        className="bg-white border-end"
        style={{
          width: 250,
          height: "100vh",
          overflowY: "auto",
          position: "sticky",
          top: 0,
          flexShrink: 0,
        }}
      >
        <SidebarMain profile={profile ?? user} />
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-grow-1 d-flex flex-column bg-light" style={{ height: "100vh" }}>
        {/* Navbar cố định */}
        <Navbar profile={profile ?? user} />

        <main
          className="flex-grow-1 overflow-auto p-4 pb-0"
          style={{
            scrollBehavior: "smooth",
          }}
        >
          <div className="container-fluid">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
