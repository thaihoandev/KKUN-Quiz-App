// userService.ts
import axiosInstance from "./axiosInstance";
import { UserResponseDTO, UserRequestDTO, PageResponse } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";

// ETag cache cho các resource đơn
const etagCache = new Map<string, string>();
const dataCache = new Map<string, UserResponseDTO>();
const saveCache = (key: string, data: UserResponseDTO, etag?: string) => {
  dataCache.set(key, data);
  if (etag) etagCache.set(key, etag);
};

// ========================== Types cho Friends/Requests ==========================
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

// ========================== Admin: Get all users (Page) ==========================
export const getAllUsers = async (params?: {
  page?: number;
  size?: number;
  sort?: string; // ví dụ: 'createdAt,desc'
}): Promise<PageResponse<UserResponseDTO>> => {
  const res = await axiosInstance.get<PageResponse<UserResponseDTO>>("/users", { params });
  return res.data;
};

// ========================== Current user với ETag ==========================
export const getCurrentUser = async (force = false): Promise<UserResponseDTO | null> => {
  const persistedUser = useAuthStore.getState().user;
  if (!persistedUser) return null;

  const key = "me";
  const headers: Record<string, string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  const res = await axiosInstance.get<UserResponseDTO>("/users/me", {
    headers,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) return dataCache.get(key) ?? null;

  const etag = (res.headers?.etag || res.headers?.ETag) as string | undefined;
  saveCache(key, res.data, etag);
  return res.data;
};

// ========================== Get user by id với ETag ==========================
export const getUserById = async (userId: string, force = false): Promise<UserResponseDTO> => {
  const key = userId;
  const headers: Record<string, string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  const res = await axiosInstance.get<UserResponseDTO>(`/users/${userId}`, {
    headers,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) {
    const cached = dataCache.get(key);
    if (cached) return cached;
    const retry = await axiosInstance.get<UserResponseDTO>(`/users/${userId}`);
    const etag = (retry.headers?.etag || retry.headers?.ETag) as string | undefined;
    saveCache(key, retry.data, etag);
    return retry.data;
  }

  const etag = (res.headers?.etag || res.headers?.ETag) as string | undefined;
  saveCache(key, res.data, etag);
  return res.data;
};

// ========================== Update profile ==========================
export const updateUser = async (userId: string, patch: Partial<UserRequestDTO>) => {
  const res = await axiosInstance.put<UserResponseDTO>(`/users/${userId}`, patch);
  const meId = useAuthStore.getState().user?.userId;
  if (meId && meId === userId) {
    try {
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

// ========================== Soft delete ==========================
export const deleteSoftUser = async (userId: string, password: string) => {
  await axiosInstance.post(`/users/${userId}/delete`, { password });
  etagCache.delete(userId);
  dataCache.delete(userId);
};

// ========================== Suggestions (Page) ==========================
export const getFriendSuggestions = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<FriendSuggestion>> => {
  const res = await axiosInstance.get<PageResponse<FriendSuggestion>>(`/users/suggestions`, {
    params,
  });
  return res.data;
};

// (nếu cần cho user cụ thể)
// export const getFriendSuggestionsForUser = async (userId: string, params?: { page?: number; size?: number; sort?: string; }) => {
//   const res = await axiosInstance.get<PageResponse<FriendSuggestion>>(`/users/${userId}/suggestions`, { params });
//   return res.data;
// };

// ========================== Friend Request Actions ==========================
export const sendFriendRequest = async (friendId: string) =>
  axiosInstance.post(`/users/me/friends/${friendId}`);

export const acceptFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/accept`);

export const declineFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/decline`);

export const cancelFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/cancel`);

// ========================== Friend Requests (Page) ==========================
export const getIncomingFriendRequestsPaged = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<FriendRequestItem>> => {
  const res = await axiosInstance.get<PageResponse<FriendRequestItem>>(
    "/users/me/friend-requests/incoming",
    { params }
  );
  return res.data;
};

export const getOutgoingFriendRequestsPaged = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<FriendRequestItem>> => {
  const res = await axiosInstance.get<PageResponse<FriendRequestItem>>(
    "/users/me/friend-requests/outgoing",
    { params }
  );
  return res.data;
};

// ========================== Friendship Status ==========================
export const getFriendshipStatus = async (targetId: string) => {
  const res = await axiosInstance.get<FriendshipStatusResponse>(
    `/users/me/friendships/${targetId}/status`
  );
  return res.data;
};

// ========================== My Friends (Page) ==========================
export const getMyFriends = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<UserResponseDTO>> => {
  const res = await axiosInstance.get<PageResponse<UserResponseDTO>>(`/users/me/friends`, {
    params,
  });
  return res.data;
};

// ========================== Email change via OTP ==========================
export const requestEmailOtp = async (newEmail: string) =>
  axiosInstance.post("/users/me/request-email-otp", { email: newEmail });

export const verifyEmailOtp = async (code: string) =>
  axiosInstance.post("/users/me/verify-email-otp", { code });
