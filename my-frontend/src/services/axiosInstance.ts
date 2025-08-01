import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL || "http://localhost:8080/api",
  withCredentials: true, // Đảm bảo gửi cookie HttpOnly
  timeout: 10000,
});

export const refreshToken = async (): Promise<boolean> => {
  try {
    await axiosInstance.post("/auth/refresh-token", {});
    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    useAuthStore.getState().logout();
    return false;
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 errors by refreshing token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If 401 error and we haven't retried, attempt to refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          console.log("Token refreshed, retrying request:", originalRequest.url);
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("Error during token refresh:", refreshError);
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;