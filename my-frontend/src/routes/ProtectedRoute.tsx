// src/routes/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/**
 * Route bảo vệ (chỉ cho phép user đã đăng nhập).
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ensureMe = useAuthStore((s) => s.ensureMe);
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      try {
        const me = await ensureMe();
        setIsAuthenticated(!!me);
      } catch (err) {
        console.warn("[ProtectedRoute] Error verifying session:", err);
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [ensureMe]);

  // 🌀 Hiển thị khi đang kiểm tra
  if (checking) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang kiểm tra đăng nhập...</span>
        </div>
      </div>
    );
  }

  // 🚪 Nếu chưa đăng nhập → chuyển về /login (nhưng không redirect lặp khi đang ở login)
  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
