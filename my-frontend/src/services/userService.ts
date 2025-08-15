// userService.ts
import axiosInstance from "./axiosInstance";
import { UserResponseDTO, UserRequestDTO } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";
import { PageResponse, PaginatedResponse } from "./notificationService";

// ETag cache
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
  const headers: Record<string, string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  const res = await axiosInstance.get("/users/me", {
    headers,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) return dataCache.get(key) ?? null;

  const etag = (res.headers?.etag || res.headers?.ETag) as string | undefined;
  saveCache(key, res.data, etag);
  return res.data;
};

// ===== Get user by id with ETag
export const getUserById = async (userId: string, force = false): Promise<UserResponseDTO> => {
  const key = userId;
  const headers: Record<string, string> = {};
  if (!force && etagCache.has(key)) headers["If-None-Match"] = etagCache.get(key)!;

  const res = await axiosInstance.get(`/users/${userId}`, {
    headers,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });

  if (res.status === 304) {
    const cached = dataCache.get(key);
    if (cached) return cached;
    const retry = await axiosInstance.get(`/users/${userId}`);
    const etag = (retry.headers?.etag || retry.headers?.ETag) as string | undefined;
    saveCache(key, retry.data, etag);
    return retry.data;
  }

  const etag = (res.headers?.etag || res.headers?.ETag) as string | undefined;
  saveCache(key, res.data, etag);
  return res.data;
};

// ===== Update profile
export const updateUser = async (userId: string, patch: Partial<UserRequestDTO>) => {
  const res = await axiosInstance.put<UserResponseDTO>(`/users/${userId}`, patch);
  const meId = useAuthStore.getState().user?.userId;
  if (meId && meId === userId) {
    try { await useAuthStore.getState().refreshMe(); } catch {}
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
    try { await useAuthStore.getState().refreshMe(); } catch {}
  }
  return res.data;
};

// ===== Soft delete
export const deleteSoftUser = async (userId: string, password: string) => {
  await axiosInstance.post(`/users/${userId}/delete`, { password });
  etagCache.delete(userId);
  dataCache.delete(userId);
};

// ===== Suggestions & Friend Request (flow mới)
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

// thay safePage hiện tại bằng phiên bản này
const safePage = <T>(resp: any, page = 0, size = 10): PageResponse<T> => {
  if (Array.isArray(resp)) {
    const total = resp.length ?? 0;
    const totalPages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
    return {
      content: resp as T[],
      page,
      size,
      totalElements: total,
      totalPages,
      hasNext: page + 1 < totalPages,
      hasPrev: page > 0,
    };
  }
  const p = resp?.page ?? resp?.number ?? page;
  const s = resp?.size ?? resp?.pageSize ?? size;
  const total = resp?.totalElements ?? resp?.total ?? resp?.totalCount ?? (Array.isArray(resp?.content) ? resp.content.length : 0);
  const totalPages = resp?.totalPages ?? (s > 0 ? Math.ceil(total / s) : 0);
  const hasNext = resp?.hasNext ?? (totalPages ? p + 1 < totalPages : false);
  const hasPrev = resp?.hasPrev ?? (p > 0);

  return {
    content: Array.isArray(resp?.content) ? resp.content : [],
    page: p,
    size: s,
    totalElements: total,
    totalPages,
    hasNext,
    hasPrev,
  };
};


export const getFriendSuggestions = async (page = 0, size = 6) => {
  const res = await axiosInstance.get(`/users/suggestions`, { params: { page, size } });
  return res.data as FriendSuggestion[];
};

// Gửi yêu cầu kết bạn (thay cho addFriend cũ)
export const sendFriendRequest = async (friendId: string) => {
  await axiosInstance.post(`/users/me/friends/${friendId}`);
};

export const getIncomingFriendRequestsPaged = async (page=0, size=10) => {
  const res = await axiosInstance.get("/users/me/friend-requests/incoming", { params: { page, size } });
  console.log("Incoming friend requests response:", res.data);
  
  return safePage<FriendRequestItem>(res?.data);
};

export const getOutgoingFriendRequestsPaged = async (page=0, size=10) => {
  const res = await axiosInstance.get("/users/me/friend-requests/outgoing", { params: { page, size } });
  console.log("Outgoing friend requests response:", res.data);
  
  return safePage<FriendRequestItem>(res?.data);
};

export const acceptFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/accept`);

export const declineFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/decline`);

export const cancelFriendRequest = async (requestId: string) =>
  axiosInstance.post(`/users/me/friend-requests/${requestId}/cancel`);

export type FriendshipStatus = "NONE" | "REQUESTED" | "INCOMING" | "FRIEND";
export type FriendshipStatusResponse = { status: FriendshipStatus; requestId?: string | null };

export const getFriendshipStatus = async (targetId: string) => {
  const res = await axiosInstance.get<FriendshipStatusResponse>(`/users/me/friendships/${targetId}/status`);
  return res.data;
};

export const getMyFriends = async () => {
  const res = await axiosInstance.get<UserResponseDTO[]>(`/users/me/friends`);
  return res.data;
};

// ===== Email change via OTP
export const requestEmailOtp = async (newEmail: string) =>
  axiosInstance.post("/users/me/request-email-otp", { email: newEmail });

export const verifyEmailOtp = async (code: string) =>
  axiosInstance.post("/users/me/verify-email-otp", { code });
