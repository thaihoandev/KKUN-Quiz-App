import { Outlet } from "react-router-dom";
import SidebarMain from "@/components/sidebars/SidebarMain";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbars/Navbar";
import { getCurrentUser } from "@/services/userService";
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const MainLayout = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await getCurrentUser();
        setProfile(data);
      } catch (err: any) {
        console.error("Không thể tải thông tin người dùng:", err);
      }
    };
    fetchUserProfile();
  }, []);

  return (
    <div className="vh-100 d-flex">
      {/* Sidebar */}
      <div
        className="bg-white border-end"
        style={{
          height: "100vh",
          overflowY: "auto",
          position: "sticky",
          top: 0,
          flexShrink: 0,
        }}
      >
        <SidebarMain profile={profile} />
      </div>

      {/* Nội dung chính */}
      <div
        className="flex-grow-1 d-flex flex-column bg-light"
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <Navbar profile={profile} />

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
