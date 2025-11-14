import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/**
 * PUBLIC ROUTE:
 * - Nếu user chưa đăng nhập → cho phép truy cập
 * - Nếu user đã đăng nhập → redirect về trang chính
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);

  // Nếu đã đăng nhập → redirect
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Nếu chưa đăng nhập → hiển thị bình thường
  return <>{children}</>;
};

export default PublicRoute;
