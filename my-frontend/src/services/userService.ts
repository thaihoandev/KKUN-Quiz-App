// src/services/userService.ts
import axiosInstance from "./axiosInstance";
import { PageResponse } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";
import { UserRequestDTO, User } from "@/types/users";

// ========================== Current user ==========================
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await axiosInstance.get<User>(`/users/me`);
    return res.data;
  } catch (e) {
    console.warn("getCurrentUser failed:", e);
    return null;
  }
};

// ========================== Admin: Get all users ==========================
export const getAllUsers = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<User>> => {
  const res = await axiosInstance.get<PageResponse<User>>(`/users/`, { params });
  return res.data;
};

// ========================== Get user by ID ==========================
export const getUserById = async (userId: string): Promise<User> => {
  const res = await axiosInstance.get<User>(`/users/${userId}`);
  return res.data;
};

// ========================== Update user ==========================
export const updateUser = async (userId: string, patch: Partial<UserRequestDTO>) => {
  const res = await axiosInstance.put<User>(`/users/${userId}`, patch);

  // Nếu update user hiện tại → update store
  const meId = useAuthStore.getState().user?.userId;
  if (meId === userId) {
    useAuthStore.getState().setUser(res.data);
  }

  return res.data;
};

// ========================== Update my profile ==========================
export const updateMyProfile = async (patch: Partial<UserRequestDTO>) => {
  const res = await axiosInstance.put<User>(`/users/me`, patch);

  // 🔄 Đồng bộ lên Zustand
  useAuthStore.getState().setUser(res.data);

  return res.data;
};

// ========================== Update my avatar ==========================
export const updateMyAvatar = async (file: File) => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await axiosInstance.post<User>(`/users/me/avatar`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  useAuthStore.getState().setUser(res.data);

  return res.data;
};

// ========================== Update avatar by ID ==========================
export const updateUserAvatar = async (userId: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await axiosInstance.post<User>(`/users/${userId}/avatar`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (useAuthStore.getState().user?.userId === userId) {
    useAuthStore.getState().setUser(res.data);
  }

  return res.data;
};

// ========================== Soft delete ==========================
export const deleteSoftUser = async (userId: string, password: string) => {
  await axiosInstance.post(`/users/${userId}/delete`, { password });
};

// ========================== Friend suggestions ==========================
export const getFriendSuggestions = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<any>> => {
  const res = await axiosInstance.get<PageResponse<any>>(
    `/users/me/friends/suggestions`,
    { params }
  );
  return res.data;
};

// ========================== Friend requests ==========================
export const sendFriendRequest = async (friendId: string) =>
  axiosInstance.post(`/users/me/friends/${friendId}`);

export const acceptFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/accept`);

export const declineFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/decline`);

export const cancelFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/cancel`);

export const getIncomingFriendRequestsPaged = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}) => {
  const res = await axiosInstance.get(`/users/me/friend-requests/incoming`, {
    params,
  });
  return res.data;
};

export const getOutgoingFriendRequestsPaged = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}) => {
  const res = await axiosInstance.get(`/users/me/friend-requests/outgoing`, {
    params,
  });
  return res.data;
};

// ========================== Friendship status ==========================
export const getFriendshipStatus = async (targetId: string) => {
  const res = await axiosInstance.get(`/users/me/friendships/${targetId}/status`);
  return res.data;
};

// ========================== My friends ==========================
export const getMyFriends = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<User>> => {
  const res = await axiosInstance.get(`/users/me/friends`, { params });
  return res.data;
};

// ========================== Email change (OTP) ==========================
export const requestEmailOtp = async (newEmail: string) =>
  axiosInstance.post(`/users/me/request-email-otp`, { email: newEmail });

export const verifyEmailOtp = async (code: string) =>
  axiosInstance.post(`/users/me/verify-email-otp`, { code });
