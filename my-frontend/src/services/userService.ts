// userService.ts
import axiosInstance from "./axiosInstance";
import { UserResponseDTO, UserRequestDTO } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";

// Cache đơn giản trong module
const etagCache = new Map<string, string>();
const dataCache = new Map<string, UserResponseDTO>();

const saveCache = (key: string, data: UserResponseDTO, etag?: string) => {
  dataCache.set(key, data);
  if (etag) etagCache.set(key, etag);
};

// ===== Admin only
export const getAllUsers = async (): Promise<UserResponseDTO[]> => {
  const res = await axiosInstance.get("/users");
  return res.data;
};

// ===== Current user with ETag
export const getCurrentUser = async (force = false): Promise<UserResponseDTO | null> => {
  const persistedUser = useAuthStore.getState().user;
  if (!persistedUser) return null;

  const key = "me";
  const headers: Record<string,string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  const res = await axiosInstance.get("/users/me", {
    headers,
    validateStatus: s => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) {
    console.log("Using cached current user data");
    
    return dataCache.get(key) ?? null;
  }

  const etag = res.headers?.etag || res.headers?.ETag;
  saveCache(key, res.data, etag);
  console.log("Current user data fetched and cached", res.data);
  
  return res.data;
};

// ===== Get user by id with ETag
export const getUserById = async (userId: string, force = false): Promise<UserResponseDTO> => {
  const key = userId;
  const headers: Record<string,string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  const res = await axiosInstance.get(`/users/${userId}`, {
    headers,
    validateStatus: s => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) {
    const cached = dataCache.get(key);
    if (cached) return cached;
    // fallback: nếu không có cache (hiếm), gọi lại không kèm If-None-Match
    const retry = await axiosInstance.get(`/users/${userId}`);
    const etag = retry.headers?.etag || retry.headers?.ETag;
    saveCache(key, retry.data, etag);
    return retry.data;
  }

  const etag = res.headers?.etag || res.headers?.ETag;
  saveCache(key, res.data, etag);
  return res.data;
};

// ===== Update profile
export const updateUser = async (userId: string, patch: Partial<UserRequestDTO>) => {
  const res = await axiosInstance.put<UserResponseDTO>(`/users/${userId}`, patch);

  // Nếu đang update chính mình -> đồng bộ store
  const meId = useAuthStore.getState().user?.userId;
  if (meId && meId === userId) {
    try {
      // ETag đã bật → rẻ, có thể trả 304
      await useAuthStore.getState().refreshMe();
    } catch {}
  }
  return res.data;
};

export const updateUserAvatar = async (userId: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axiosInstance.post<UserResponseDTO>(`/users/${userId}/avatar`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const meId = useAuthStore.getState().user?.userId;
  if (meId && meId === userId) {
    try {
      await useAuthStore.getState().refreshMe();
    } catch {}
  }
  return res.data;
};

// ===== Soft delete
export const deleteSoftUser = async (userId: string, password: string) => {
  // khuyến nghị dùng /users/me/delete ở FE; endpoint cũ /{id}/delete vẫn hoạt động
  await axiosInstance.post(`/users/${userId}/delete`, { password });
  // clear cache key
  etagCache.delete(userId);
  dataCache.delete(userId);
};

// ===== Suggestions & Add friend (không liên quan ETag user profile)
export type FriendSuggestion = {
  userId: string;
  name?: string;
  username?: string;
  avatar?: string;
  mutualFriends: number;
};

export const getFriendSuggestions = async (page = 0, size = 6) => {
  const res = await axiosInstance.get(`/users/suggestions`, { params: { page, size }});
  return res.data as FriendSuggestion[];
};

export const addFriend = async (friendId: string) => {
  // dùng current user endpoint
  await axiosInstance.post(`/users/me/friends/${friendId}`);
};

// ===== Email change via OTP =====
export const requestEmailOtp = async (newEmail: string) => {
  // gửi mã OTP về email mới
  return axiosInstance.post("/users/me/request-email-otp", { email: newEmail });
};

export const verifyEmailOtp = async (code: string) => {
  // xác thực mã OTP -> BE sẽ cập nhật email
  return axiosInstance.post("/users/me/verify-email-otp", { code });
};