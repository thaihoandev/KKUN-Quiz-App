import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";

const baseURL = import.meta.env.VITE_BASE_API_URL;

const api = axios.create({
  baseURL,
  withCredentials: true, // ✅ Quan trọng: gửi cookie refreshToken
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: any) => void;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
};

// ============================================
// REQUEST INTERCEPTOR: Attach Access Token
// ============================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR: Handle Token Refresh
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ❌ Không retry nếu không có config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // ✅ Chỉ retry khi 401 và chưa retry lần nào
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // ❌ Không retry các endpoint auth (tránh infinite loop)
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/google") ||
        originalRequest.url?.includes("/auth/refresh-token")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // ✅ Nếu đang refresh, đưa request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      isRefreshing = true;

      try {
        // ✅ Gọi refresh token endpoint
        // refreshToken được gửi tự động qua cookie (withCredentials: true)
        const response = await api.post("/auth/refresh-token", {});
        const newAccessToken = response.data.accessToken;

        // ✅ Lưu token mới vào store
        useAuthStore.getState().setAccessToken(newAccessToken);

        // ✅ Process tất cả request trong queue
        processQueue(null, newAccessToken);

        // ✅ Retry original request với token mới
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // ❌ Refresh failed -> logout user
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ❌ Các lỗi khác không retry
    return Promise.reject(error);
  }
);

export default api;