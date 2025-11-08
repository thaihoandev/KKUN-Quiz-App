// src/utils/axiosInstance.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";
import { redirectToLogin } from "@/utils/navigationHelper";

/** Extend the Axios config to track retry state */
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Base URL từ .env */
const baseURL = import.meta.env.VITE_BASE_API_URL || "http://localhost:8080/api";

/** Tạo instance riêng cho refresh token */
const refreshInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

/** Tạo instance chính cho toàn app */
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

/** Gọi refresh token API */
export const refreshToken = async (): Promise<boolean> => {
  try {
    await refreshInstance.post("/auth/refresh-token", {});
    console.info("[axiosInstance] ✅ Access token refreshed");
    return true;
  } catch (err) {
    console.error("[axiosInstance] ❌ Refresh token failed:", err);
    return false;
  }
};

/** Request interceptor */
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

/** Response interceptor */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;
    const is401 = error.response?.status === 401;
    const isRefreshCall = originalRequest.url?.endsWith("/auth/refresh-token");
    const hasRefreshCookie = Boolean(Cookies.get("refreshToken"));

    // ✅ Trường hợp 1: accessToken hết hạn nhưng vẫn có refreshToken
    if (is401 && !originalRequest._retry && !isRefreshCall && hasRefreshCookie) {
      originalRequest._retry = true;
      const ok = await refreshToken();

      if (ok) {
        // Đợi backend set cookie mới (~100ms)
        await new Promise((r) => setTimeout(r, 150));
        console.info("[axiosInstance] Retrying original request after refresh");
        return axiosInstance(originalRequest);
      }

      // ❌ Refresh thất bại thật → xóa session
      console.warn("[axiosInstance] Refresh failed — logging out...");
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // ✅ Trường hợp 2: không có refreshToken (đăng xuất)
    if (is401 && !isRefreshCall && !hasRefreshCookie) {
      console.warn("[axiosInstance] 401 without refresh cookie — skipping auto redirect");
      useAuthStore.getState().logout();
      // ❌ Không redirect tự động ở đây nữa
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
