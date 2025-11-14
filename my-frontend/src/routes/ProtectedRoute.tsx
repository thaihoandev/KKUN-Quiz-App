import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/axiosInstance";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    accessToken,
    user,
    setAccessToken,
    setUser,
    hasInitialized,
    setInitialized,
  } = useAuthStore();

  const [checking, setChecking] = useState(!hasInitialized);
  const location = useLocation();

  useEffect(() => {
    const initSession = async () => {
      if (hasInitialized) {
        setChecking(false);
        return;
      }

      try {
        // Nếu chưa có accessToken → thử refresh token
        if (!accessToken) {
          const refreshResp = await api.post("/auth/refresh-token");
          setAccessToken(refreshResp.data.accessToken);
        }

        // Sau đó load user
        const meResp = await api.get("/users/me");
        setUser(meResp.data);
      } catch (err) {
        console.warn("[ProtectedRoute] Session restore failed:", err);
        setAccessToken(null);
        setUser(null);
      } finally {
        setInitialized();
        setChecking(false);
      }
    };

    initSession();
  }, [hasInitialized, accessToken]);

  // Loading UI khi đang kiểm tra
  if (checking) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang kiểm tra đăng nhập...</span>
        </div>
      </div>
    );
  }

  // Nếu không có accessToken → redirect vào Login
  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
