import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import HeaderMain from "@/components/headers/HeaderMain";

const SingleLayout: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ensureMe = useAuthStore((s) => s.ensureMe);
  const user = useAuthStore((s) => s.user);

  // ✅ Load thông tin người dùng nếu đã đăng nhập
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await ensureMe();
        if (me) setProfile(me);
      } catch (err) {
        console.warn("Không thể tải thông tin người dùng:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [ensureMe]);

  // ✅ Hiển thị loading khi đang xác thực
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🧭 Header luôn hiển thị trên cùng, không che nội dung */}
      <div className="sticky-top shadow-sm z-50">
        <HeaderMain profile={profile ?? user} />
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
    </>
  );
};

export default SingleLayout;
