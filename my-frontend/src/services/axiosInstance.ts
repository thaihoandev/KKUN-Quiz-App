// src/utils/axiosInstance.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import Cookies from "js-cookie";
/**
 * Extend the Axios request config to track retry state
 */
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Create a “refresh” instance without interceptors, used only for the refresh-token call
 */
const refreshInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL || "http://localhost:8080/api",
  withCredentials: true,
  timeout: 10000,
});

/**
 * Main Axios instance for all API calls
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL || "http://localhost:8080/api",
  withCredentials: true, // send HttpOnly cookies
  timeout: 10000,
});

/**
 * Attempt to refresh the access token by calling /auth/refresh-token.
 * On failure, force logout.
 */
export const refreshToken = async (): Promise<boolean> => {
  try {
    // Use the bare instance so we don't trigger our own interceptor
    await refreshInstance.post("/auth/refresh-token", {});
    return true;
  } catch (err) {
    console.error("Error refreshing token:", err);
    useAuthStore.getState().logout();
    return false;
  }
};

/**
 * Request interceptor (optional): you could add Authorization header here if using bearer tokens
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // e.g. const token = useAuthStore.getState().user?.accessToken;
    // if (token) config.headers!['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * - On 401, try to call refreshToken() once
 * - Retry the original request if refresh succeeded
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;
    const is401 = error.response?.status === 401;
    const isRefreshCall = originalRequest.url?.endsWith("/auth/refresh-token");

    // Lấy cookie refresh-token
    const hasRefreshCookie = Boolean(Cookies.get("refreshToken"));

    // Chỉ thử refresh nếu:
    // - Lần đầu gặp 401
    // - Không phải call /auth/refresh-token
    // - Và vẫn còn cookie refresh-token
    if (is401 && !originalRequest._retry && !isRefreshCall && hasRefreshCookie) {
      originalRequest._retry = true;

      const ok = await refreshToken();
      if (ok) {
        return axiosInstance(originalRequest);
      } else {
        useAuthStore.getState().logout();
        // window.location.replace("/login");
      }
    }

    // Nếu không còn cookie refresh-token, logout luôn
    if (is401 && !isRefreshCall && !hasRefreshCookie) {
      useAuthStore.getState().logout();
      // window.location.replace("/login");
      return; // ngăn axios tiếp tục retry
    }

    return Promise.reject(error);
  }
);



export default axiosInstance;
