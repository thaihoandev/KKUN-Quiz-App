// src/services/userService.ts
import axiosInstance from "./axiosInstance";
import { PageResponse } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";
import { UserRequestDTO, User } from "@/types/users";

// ========================== Cache (ETag) ==========================
const etagCache = new Map<string, string>();
const dataCache = new Map<string, User>();
const saveCache = (key: string, data: User, etag?: string) => {
  dataCache.set(key, data);
  if (etag) etagCache.set(key, etag);
};

// ========================== Types ==========================
export type FriendSuggestion = {
  userId: string;
  name?: string;
  username?: string;
  avatar?: string;
  mutualFriends: number;
};

export type FriendRequestItem = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELED";
  createdAt: string;

  requesterId?: string;
  requesterName?: string;
  requesterUsername?: string;
  requesterAvatar?: string;

  receiverId?: string;
  receiverName?: string;
  receiverUsername?: string;
  receiverAvatar?: string;
};

export type FriendshipStatus = "NONE" | "REQUESTED" | "INCOMING" | "FRIEND";
export type FriendshipStatusResponse = { status: FriendshipStatus; requestId?: string | null };

// ========================== Admin: Get all users ==========================
export const getAllUsers = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<User>> => {
  const res = await axiosInstance.get<PageResponse<User>>(`/users/`, { params });
  return res.data;
};

// ========================== Current user ==========================
export const getCurrentUser = async (force = false): Promise<User | null> => {
  const persistedUser = useAuthStore.getState().user;
  if (!persistedUser) return null;

  const key = "me";
  const headers: Record<string, string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  // ✅ Backend endpoint: /api/users/me
  const res = await axiosInstance.get<User>(`/users/me`, {
    headers,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) return dataCache.get(key) ?? null;

  const etag = (res.headers?.etag || res.headers?.ETag) as string | undefined;
  saveCache(key, res.data, etag);
  return res.data;
};

// ========================== Get user by ID ==========================
export const getUserById = async (userId: string, force = false): Promise<User> => {
  const key = userId;
  const headers: Record<string, string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  const res = await axiosInstance.get<User>(`/users/${userId}`, {
    headers,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) {
    const cached = dataCache.get(key);
    if (cached) return cached;
    const retry = await axiosInstance.get<User>(`/users/${userId}`);
    const etag = (retry.headers?.etag || retry.headers?.ETag) as string | undefined;
    saveCache(key, retry.data, etag);
    return retry.data;
  }

  const etag = (res.headers?.etag || res.headers?.ETag) as string | undefined;
  saveCache(key, res.data, etag);
  return res.data;
};

// ========================== Update user ==========================
export const updateUser = async (userId: string, patch: Partial<UserRequestDTO>) => {
  const res = await axiosInstance.put<User>(`/users/${userId}`, patch);
  const meId = useAuthStore.getState().user?.userId;
  if (meId && meId === userId) {
    try {
      await useAuthStore.getState().refreshMe();
    } catch {}
  }
  return res.data;
};
// ========================== Update my profile ==========================
export const updateMyProfile = async (patch: Partial<UserRequestDTO>) => {
  // ✅ Gọi API backend
  const res = await axiosInstance.put<User>(`/users/me`, patch);

  // ✅ Xóa cache ETag để lần refresh sau luôn lấy dữ liệu mới
  useAuthStore.setState({ etag: null });

  // ✅ Cập nhật trực tiếp user trong Zustand để UI phản ánh ngay
  useAuthStore.getState().updateUserPartial(res.data);

  return res.data;
};

// ========================== Update my avatar ==========================
export const updateMyAvatar = async (file: File) => {
  const fd = new FormData();
  fd.append("file", file);

  // ✅ Backend: /api/users/me/avatar
  const res = await axiosInstance.post<User>(`/users/me/avatar`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // ✅ Xóa ETag để refresh lại bản mới
  useAuthStore.setState({ etag: null });

  // ✅ Cập nhật store ngay lập tức
  useAuthStore.getState().updateUserPartial(res.data);

  return res.data;
};


// ========================== Update avatar ==========================
export const updateUserAvatar = async (userId: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axiosInstance.post<User>(`/users/${userId}/avatar`, fd, {
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

// ========================== Soft delete ==========================
export const deleteSoftUser = async (userId: string, password: string) => {
  // ✅ Backend endpoint: /api/users/{id}/delete
  await axiosInstance.post(`/users/${userId}/delete`, { password });
  etagCache.delete(userId);
  dataCache.delete(userId);
};

// ========================== Friend suggestions ==========================
export const getFriendSuggestions = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<FriendSuggestion>> => {
  // ✅ Backend: /api/users/me/friends/suggestions
  const res = await axiosInstance.get<PageResponse<FriendSuggestion>>(
    `/users/me/friends/suggestions`,
    { params }
  );
  return res.data;
};

// ========================== Friend requests ==========================
export const sendFriendRequest = async (friendId: string) =>
  // ✅ Backend: /api/users/me/friends/{friendId}
  axiosInstance.post(`/users/me/friends/${friendId}`);

export const acceptFriendRequest = async (requestId: string) =>
  // ✅ Backend: /api/users/me/friend-requests/{requestId}/accept
  axiosInstance.post(`/users/me/friend-requests/${requestId}/accept`);

export const declineFriendRequest = async (requestId: string) =>
  // ✅ Backend: /api/users/me/friend-requests/{requestId}/decline
  axiosInstance.post(`/users/me/friend-requests/${requestId}/decline`);

export const cancelFriendRequest = async (requestId: string) =>
  // ✅ Backend: /api/users/me/friend-requests/{requestId}/cancel
  axiosInstance.post(`/users/me/friend-requests/${requestId}/cancel`);

export const getIncomingFriendRequestsPaged = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<FriendRequestItem>> => {
  // ✅ Backend: /api/users/me/friend-requests/incoming
  const res = await axiosInstance.get<PageResponse<FriendRequestItem>>(
    `/users/me/friend-requests/incoming`,
    { params }
  );
  return res.data;
};

export const getOutgoingFriendRequestsPaged = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<FriendRequestItem>> => {
  // ✅ Backend: /api/users/me/friend-requests/outgoing
  const res = await axiosInstance.get<PageResponse<FriendRequestItem>>(
    `/users/me/friend-requests/outgoing`,
    { params }
  );
  return res.data;
};

// ========================== Friendship status ==========================
export const getFriendshipStatus = async (targetId: string) => {
  // ✅ Backend: /api/users/me/friendships/{targetId}/status
  const res = await axiosInstance.get<FriendshipStatusResponse>(
    `/users/me/friendships/${targetId}/status`
  );
  return res.data;
};

// ========================== My friends ==========================
export const getMyFriends = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<User>> => {
  // ✅ Backend: /api/users/me/friends
  const res = await axiosInstance.get<PageResponse<User>>(`/users/me/friends`, {
    params,
  });
  return res.data;
};

// ========================== Email change (OTP) ==========================
export const requestEmailOtp = async (newEmail: string) =>
  // ✅ Backend: /api/users/me/request-email-otp
  axiosInstance.post(`/users/me/request-email-otp`, { email: newEmail });

export const verifyEmailOtp = async (code: string) =>
  // ✅ Backend: /api/users/me/verify-email-otp
  axiosInstance.post(`/users/me/verify-email-otp`, { code });
