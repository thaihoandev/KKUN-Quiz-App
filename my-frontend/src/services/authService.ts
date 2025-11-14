import { UserRequestDTO } from "@/types/users";
import api from "./axiosInstance";

// ================== LOGIN ==================
export const loginApi = async (username: string, password: string) => {
  const response = await api.post("/auth/login", {
    username,
    password,
  });
  
  // Backend trả: { accessToken, user }
  // refreshToken được set vào cookie tự động qua Set-Cookie header
  return response.data;
};

// ================== REGISTER ==================
export const registerApi = async (userData: UserRequestDTO) => {
  const response = await api.post("/auth/register", userData);
  
  // Backend trả: { accessToken, user }
  // refreshToken được set vào cookie tự động
  return response.data;
};

// ================== GOOGLE LOGIN ==================
export const loginGoogleApi = async (googleAccessToken: string) => {
  const response = await api.post(
    "/auth/google",
    { accessToken: googleAccessToken },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  
  // Backend trả: { accessToken, user }
  // refreshToken được set vào cookie tự động
  return response.data;
};

// ================== LOGOUT ==================
export const logoutApi = async (): Promise<void> => {
  // refreshToken được gửi tự động qua cookie
  await api.post("/auth/logout");
  // Backend sẽ:
  // 1. Revoke refresh token trong DB
  // 2. Clear cookie bằng Set-Cookie với maxAge=0
};

// ================== CHANGE PASSWORD ==================
export const changePasswordApi = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await api.post("/auth/change-password", payload);
};

// ================== REFRESH TOKEN ==================
// ⚠️ Không cần export function này vì đã handle trong interceptor
// Nhưng giữ lại để reference
export const refreshTokenApi = async () => {
  // refreshToken được gửi tự động qua cookie
  const response = await api.post("/auth/refresh-token");
  return response.data; // { accessToken }
};