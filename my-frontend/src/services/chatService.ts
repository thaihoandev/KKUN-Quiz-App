// src/services/chatService.ts
import { PageResponse } from "@/interfaces";
import axiosInstance from "@/services/axiosInstance";

// ==== Types (khớp DTO backend) ====

export interface UserBriefDTO {
  userId: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface MediaBriefDTO {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  clientId?: string;
  sender: UserBriefDTO;
  content?: string;
  replyToId?: string;
  createdAt: string; // ISO
  editedAt?: string;
  deleted?: boolean;
  attachments: MediaBriefDTO[];
  reactions: Record<string, number>;
  reactedByMe?: boolean;
}

export interface ParticipantDTO {
  userId: string;
  role: "OWNER" | "MODERATOR" | "MEMBER";
  nickname?: string;
  joinedAt: string;
  user: UserBriefDTO;
}

export interface ConversationDTO {
  id: string;
  type: "DIRECT" | "GROUP";
  title?: string;
  createdAt: string;
  avatarUrl?: string;
  participants: ParticipantDTO[];
  lastMessage?: MessageDTO | null;
  unreadCount: number;
}

export interface SendMessageRequest {
  conversationId: string;
  content?: string;
  mediaIds?: string[];
  replyToId?: string;
  clientId?: string;
}

// ==== API ====

// Khớp với @RequestMapping("/api/chat") trong backend controller
const BASE = "/chat";

export async function getMyConversations(me: string, page = 0, size = 20) {
  const res = await axiosInstance.get<PageResponse<ConversationDTO>>(`${BASE}/conversations`, {
    params: { me, page, size, sort: "createdAt,desc" },
  });
  return res.data;
}

export async function getMessages(params: {
  conversationId: string;
  me: string;
  beforeMessageId?: string;
  page?: number; // mặc định 0
  size?: number; // mặc định 30
}) {
  const { conversationId, me, beforeMessageId, page = 0, size = 30 } = params;
  const res = await axiosInstance.get<PageResponse<MessageDTO>>(`${BASE}/messages`, {
    params: {
      conversationId,
      me,
      beforeMessageId,
      page,
      size,
      sort: "createdAt,desc",
    },
  });
  return res.data;
}

/**
 * Gửi tin nhắn theo cơ chế async:
 * - Backend trả 202 Accepted, không body.
 * - UI sẽ nhận MessageDTO qua kênh realtime (STOMP) để thay temp-message bằng bản thật.
 */
export async function sendMessage(senderId: string, body: SendMessageRequest): Promise<void> {
  const res = await axiosInstance.post(`${BASE}/messages`, body, {
    params: { senderId },
    // Không cần data trả về; cho chắc thì nhận text
    responseType: "text",
    // (tuỳ chọn) chấp nhận cả 202 (chuẩn) và 200 (nếu có proxy/ingress chỉnh)
    validateStatus: (s) => (s >= 200 && s < 300),
  });

  // Không dùng res.data nữa. Nếu cần kiểm tra chặt:
  // if (res.status !== 202) { /* vẫn coi là ok nếu 2xx */ }
}

export async function markReadUpTo(conversationId: string, lastMessageId: string, readerId: string) {
  await axiosInstance.post<void>(`${BASE}/messages/${lastMessageId}/read-up-to`, null, {
    params: { conversationId, readerId },
  });
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  await axiosInstance.post<void>(`${BASE}/messages/${messageId}/reactions`, null, {
    params: { userId, emoji },
  });
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  await axiosInstance.delete<void>(`${BASE}/messages/${messageId}/reactions`, {
    params: { userId, emoji },
  });
}

// (tuỳ chọn) tạo/lấy direct
export async function getOrCreateDirect(userA: string, userB: string) {
  const res = await axiosInstance.post<ConversationDTO>(`${BASE}/conversations/direct`, null, {
    params: { userA, userB },
  });
  return res.data;
}
