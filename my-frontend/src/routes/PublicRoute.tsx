import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/**
 * Route cho các trang public (login, register, v.v.)
 * - Nếu user chưa đăng nhập → cho phép truy cập
 * - Nếu user đã đăng nhập → redirect về trang chính (ví dụ /)
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ensureMe = useAuthStore((s) => s.ensureMe);
  const user = useAuthStore((s) => s.user);

  const [checking, setChecking] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const me = await ensureMe();
        // ✅ Nếu chưa có user => guest
        setIsGuest(!me);
      } catch {
        setIsGuest(true);
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [ensureMe]);

  // Hiển thị khi đang kiểm tra login
  if (checking) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang kiểm tra trạng thái đăng nhập...</span>
        </div>
      </div>
    );
  }

  // 🚫 Nếu đã login → chuyển về trang chính
  if (user && !isGuest) {
    return <Navigate to="/" replace />;
  }

  // ✅ Nếu chưa login → cho phép vào trang public
  return <>{children}</>;
};

export default PublicRoute;
