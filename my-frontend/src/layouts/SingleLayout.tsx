import React from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import HeaderMain from "@/components/headers/HeaderMain";
import Footer from "@/components/Footer";

const SingleLayout: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {/* 🧭 Header luôn hiển thị trên cùng, không che nội dung */}
      <div className="sticky-top shadow-sm z-50">
        <HeaderMain profile={user} />
      </div>

      {/* 🌈 Nội dung trang */}
      <main
        className="py-0 px-0"
        style={{
          minHeight: "100vh",
          width: "100%",          // ✅ thay vì maxWidth: 100vw
          overflowX: "clip",
        }}
      >
        <Outlet />
      </main>
      <Footer />

    </>
  );
};

export default SingleLayout;
