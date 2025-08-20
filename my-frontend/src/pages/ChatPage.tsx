// src/pages/ChatPage.tsx
// Chat UI: no day header, hide seconds, show sender meta only if gap >= 1 minute or sender changes,
// fetch newest on open, lazy-load older messages on scroll-up. Includes optimistic send + clientId de-dupe.

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { List, Avatar, Button, Input, Typography, Badge, Select, Empty, message, Spin } from "antd";
import { SendOutlined, LikeOutlined, LoadingOutlined } from "@ant-design/icons";
import { Client, IMessage, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ConversationDTO,
  MessageDTO,
  getMyConversations,
  getMessages,
  sendMessage,
  markReadUpTo,
  addReaction,
  removeReaction,
  getOrCreateDirect,
} from "@/services/chatService";
import { PageResponse, UserDto, UserResponseDTO } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";
import { getMyFriends } from "@/services/userService";

const PAGE_SIZE_CONV = 20;
const PAGE_SIZE_MSG = 30;
const PAGE_SIZE_FRIENDS = 20;
const SHOW_META_GAP_MS = 60 * 1000; // 1 minute
const { Text, Title } = Typography;
const { Option } = Select as any;

// WebSocket endpoint (Vite env var or fallback)
const WS_ENDPOINT: string = (import.meta as any).env?.VITE_WS_URL || "/ws";

// ---------- Helpers ----------
function byNewest(aTime?: string, bTime?: string) {
  const ta = new Date(aTime ?? 0).getTime();
  const tb = new Date(bTime ?? 0).getTime();
  return tb - ta;
}

// Upsert message: match by clientId first, then by id
function upsertMessage(list: MessageDTO[], incoming: MessageDTO): MessageDTO[] {
  if (!incoming) return list;
  if (incoming.clientId) {
    const i = list.findIndex(m => m.clientId === incoming.clientId);
    if (i >= 0) {
      const next = list.slice();
      next[i] = incoming;
      return next;
    }
  }
  const j = list.findIndex(m => m.id === incoming.id);
  if (j >= 0) {
    const next = list.slice();
    next[j] = incoming;
    return next;
  }
  return [...list, incoming];
}

function formatHm(ts: any) {
  try {
    return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); // no seconds
  } catch {
    return "";
  }
}

function shouldShowMeta(prev: MessageDTO | undefined, curr: MessageDTO): boolean {
  if (!curr) return false;
  if (!prev) return true;
  const prevSender = (prev as any).sender?.userId;
  const currSender = (curr as any).sender?.userId;
  if (prevSender !== currSender) return true;
  const prevAt = new Date((prev as any).createdAt ?? 0).getTime();
  const currAt = new Date((curr as any).createdAt ?? 0).getTime();
  return (currAt - prevAt) >= SHOW_META_GAP_MS;
}

const ChatPage: React.FC = () => {
  const user = useAuthStore((s) => s.user) as UserDto | null;
  const currentUserId = user?.userId;

  // Sidebar state
  const [convPage, setConvPage] = useState<PageResponse<ConversationDTO> | null>(null);
  const [convs, setConvs] = useState<ConversationDTO[]>([]);
  const [convPageIndex, setConvPageIndex] = useState(0);
  const [selectedConv, setSelectedConv] = useState<ConversationDTO | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // Friends (for quick-direct chat)
  const [friends, setFriends] = useState<UserResponseDTO[]>([]);
  const [friendsPage, setFriendsPage] = useState<PageResponse<UserResponseDTO> | null>(null);
  const [friendPageIndex, setFriendPageIndex] = useState(0);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");

  // Messages state
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [input, setInput] = useState("");
  const scrollBoxRef = useRef<HTMLDivElement | null>(null);

  // STOMP
  const stompRef = useRef<Client | null>(null);
  const topicSubRef = useRef<any>(null);
  const inboxSubRef = useRef<any>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  const autoScrollToBottomRef = useRef<boolean>(false);

  const oldestId = useMemo(() => (messages.length ? messages[0].id : undefined), [messages]);

  // ---------- Scroll helpers ----------
  const scrollToBottom = () => {
    const box = scrollBoxRef.current; if (!box) return; box.scrollTop = box.scrollHeight;
  };
  const scrollToBottomSmooth = () => {
    const box = scrollBoxRef.current; if (!box) return; box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  };
  const isNearBottom = () => {
    const box = scrollBoxRef.current; return box ? box.scrollHeight - box.scrollTop - box.clientHeight < 120 : false;
  };
  const preserveScrollAfterPrepend = () => {
    const box = scrollBoxRef.current; if (!box) return;
    const prev = box.scrollHeight;
    requestAnimationFrame(() => { const next = box.scrollHeight; box.scrollTop += next - prev; });
  };

  useEffect(() => { selectedConvIdRef.current = selectedConv?.id ?? null; }, [selectedConv?.id]);

  // When images in the message list load, keep sticking to bottom if user is near bottom
  useEffect(() => {
    const el = scrollBoxRef.current;
    if (!el) return;
    const onLoad = (e: any) => {
      const t = e?.target as HTMLElement | undefined;
      if (t && t.tagName === 'IMG' && isNearBottom()) {
        scrollToBottom();
      }
    };
    el.addEventListener('load', onLoad, true);
    return () => el.removeEventListener('load', onLoad, true);
  }, [selectedConv?.id]);

  // After messages render for a newly opened conversation, force scroll to newest
  useEffect(() => {
    if (!autoScrollToBottomRef.current) return;
    requestAnimationFrame(() => {
      scrollToBottom();
      setTimeout(scrollToBottom, 0); // extra tick for async layout/images
    });
    autoScrollToBottomRef.current = false;
  }, [messages, selectedConv?.id]);

  // ---------- STOMP: subscribe to conversation topic ----------
  const subscribeConversationTopic = (client: Client, conversationId: string) => {
    try {
      topicSubRef.current?.unsubscribe?.();
      topicSubRef.current = client.subscribe(`/topic/conv.${conversationId}`, (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body) as MessageDTO;
          if (!payload?.id) return;
          setMessages(prev => upsertMessage(prev, payload));
          if (isNearBottom()) setTimeout(scrollToBottomSmooth, 0);
        } catch (e) {
          console.error(`[TOPIC conv.${conversationId}] parse-error`, e, msg.body);
        }
      });
    } catch (e) {
      console.error("[TOPIC] subscribe error", e);
    }
  };

  // ---------- Sidebar: refresh first page and merge ----------
  const refreshTopConvs = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const firstPage = await getMyConversations(currentUserId, 0, PAGE_SIZE_CONV);
      setConvPage(firstPage);
      setConvPageIndex(0);
      setConvs(prev => {
        const map = new Map<string, ConversationDTO>();
        [...firstPage.content, ...prev].forEach(c => map.set(c.id, c));
        return Array.from(map.values()).sort((a, b) => byNewest(a.lastMessage?.createdAt ?? a.createdAt, b.lastMessage?.createdAt ?? b.createdAt));
      });
    } catch (e) {
      console.warn("[CONV] refreshTopConvs error", e);
    }
  }, [currentUserId]);

  // ---------- STOMP client lifecycle ----------
  const ensureStompClient = useCallback(() => {
    if (stompRef.current) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.debug = (str: string) => { if (!/PING|PONG/.test(str)) console.log("[STOMP]", str); };

    client.onConnect = (_frame: IFrame) => {
      // Always re-subscribe inbox after reconnect
      try { inboxSubRef.current?.unsubscribe?.(); } catch {}
      inboxSubRef.current = client.subscribe("/user/queue/inbox", async (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body);
          if (payload?.type !== "NEW_MESSAGE" || !payload?.message) return;
          const dto = payload.message as MessageDTO;
          const convId = dto.conversationId;
          const activeId = selectedConvIdRef.current;

          if (activeId === convId) {
            // Active chat: show message, move conv up, reset unread, mark read
            setMessages(prev => upsertMessage(prev, dto));
            if (isNearBottom()) setTimeout(scrollToBottomSmooth, 0);

            setConvs(prev => {
              const idx = prev.findIndex(c => c.id === convId);
              if (idx === -1) { refreshTopConvs(); return prev; }
              const updated: ConversationDTO = { ...prev[idx], lastMessage: dto, unreadCount: 0 } as any;
              const rest = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
              return [updated, ...rest];
            });

            if (currentUserId) markReadUpTo(convId, dto.id, currentUserId).catch(() => {});
          } else {
            // Not active: bump unread and reorder
            setConvs(prev => {
              const idx = prev.findIndex(c => c.id === convId);
              if (idx === -1) { refreshTopConvs(); return prev; }
              const updated: ConversationDTO = { ...prev[idx], lastMessage: dto, unreadCount: (prev[idx].unreadCount ?? 0) + 1 } as any;
              const rest = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
              return [updated, ...rest];
            });
          }
        } catch (e) {
          console.error("[INBOX] parse-error", e, msg.body);
        }
      });

      const activeId = selectedConvIdRef.current;
      if (activeId) subscribeConversationTopic(client, activeId);
    };

    client.onWebSocketClose = (evt) => {
      console.warn("[STOMP] websocket closed", evt.code, evt.reason);
      try { inboxSubRef.current?.unsubscribe?.(); } catch {}
      inboxSubRef.current = null;
      try { topicSubRef.current?.unsubscribe?.(); } catch {}
      topicSubRef.current = null;
    };

    client.onStompError = (frame) => { console.error("[STOMP] broker error", frame.headers, frame.body); };
    client.onWebSocketError = (evt) => { console.error("[STOMP] websocket error", evt); };

    client.activate();
    stompRef.current = client;
  }, [currentUserId, refreshTopConvs]);

  // ---------- Initial load ----------
  useEffect(() => {
    if (!currentUserId) return;

    ensureStompClient();

    (async () => {
      setLoadingConvs(true);
      try {
        const page = await getMyConversations(currentUserId, 0, PAGE_SIZE_CONV);
        const sorted = [...page.content].sort((a, b) => byNewest(a.lastMessage?.createdAt ?? a.createdAt, b.lastMessage?.createdAt ?? b.createdAt));
        setConvPage(page);
        setConvs(sorted);
        if (sorted.length && !selectedConv) setSelectedConv(sorted[0]);
      } finally {
        setLoadingConvs(false);
      }
    })();

    return () => {
      try { topicSubRef.current?.unsubscribe?.(); } catch {}
      try { inboxSubRef.current?.unsubscribe?.(); } catch {}
      try { stompRef.current?.deactivate?.(); } catch {}
      topicSubRef.current = null;
      inboxSubRef.current = null;
      stompRef.current = null;
    };
  }, [currentUserId, ensureStompClient]);

  const loadMoreConvs = async () => {
    if (!currentUserId || !convPage || convPage.last || loadingConvs) return;
    const next = convPageIndex + 1;
    setLoadingConvs(true);
    try {
      const page = await getMyConversations(currentUserId, next, PAGE_SIZE_CONV);
      setConvPage(page);
      setConvPageIndex(next);
      setConvs(prev => {
        const merged = [...prev, ...page.content];
        return merged.sort((a, b) => byNewest(a.lastMessage?.createdAt ?? a.createdAt, b.lastMessage?.createdAt ?? b.createdAt));
      });
    } finally {
      setLoadingConvs(false);
    }
  };

  // ---------- Friends for quick DM ----------
  const loadFriends = useCallback(
    async (page = 0, append = false) => {
      setLoadingFriends(true);
      try {
        const res = await getMyFriends({ page, size: PAGE_SIZE_FRIENDS });
        setFriendsPage(res);
        setFriendPageIndex(res.number ?? page);
        setFriends(prev => (append ? [...prev, ...res.content] : res.content));
      } finally {
        setLoadingFriends(false);
      }
    }, []
  );

  useEffect(() => { loadFriends(0, false); }, [loadFriends]);

  const loadMoreFriends = async () => {
    if (!friendsPage || friendsPage.last || loadingFriends) return;
    await loadFriends(friendPageIndex + 1, true);
  };

  const filteredFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => [f.name, f.username, f.email].filter(Boolean).some((s) => (s as string).toLowerCase().includes(q)));
  }, [friendQuery, friends]);

  // ---------- When selecting a conversation (fetch newest first) ----------
  useEffect(() => {
    if (!selectedConv || !currentUserId) return;

    setMessages([]);
    setHasMoreMsgs(true);

    (async () => {
      setLoadingMsgs(true);
      try {
        const page = await getMessages({ conversationId: selectedConv.id, me: currentUserId, size: PAGE_SIZE_MSG });
        const arr = [...page.content].reverse(); // oldest -> newest for display
        setMessages(arr);
        setHasMoreMsgs(!page.last);
        autoScrollToBottomRef.current = true; // ensure we snap to bottom after render
        if (arr.length) await markReadUpTo(selectedConv.id, arr[arr.length - 1].id, currentUserId);
      } finally {
        setLoadingMsgs(false);
      }
    })();

    if (stompRef.current?.connected) {
      subscribeConversationTopic(stompRef.current, selectedConv.id);
    } else {
      ensureStompClient();
    }

    return () => {
      try { topicSubRef.current?.unsubscribe?.(); } catch {}
      topicSubRef.current = null;
    };
  }, [selectedConv?.id, currentUserId, ensureStompClient]);

  // ---------- Pagination older messages (lazy load on scroll-up) ----------
  const loadOlder = async () => {
    if (!selectedConv || !currentUserId || !hasMoreMsgs || loadingMsgs || !oldestId) return;
    setLoadingMsgs(true);
    try {
      const page = await getMessages({ conversationId: selectedConv.id, me: currentUserId, beforeMessageId: oldestId, size: PAGE_SIZE_MSG });
      const moreAsc = [...page.content].reverse();
      setMessages(prev => [...moreAsc, ...prev]);
      setHasMoreMsgs(!page.last);
      preserveScrollAfterPrepend();
    } finally {
      setLoadingMsgs(false);
    }
  };

  // ---------- Send message (optimistic) ----------
  const onSend = async () => {
    const text = input.trim();
    if (!text || !selectedConv || !currentUserId) return;

    const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // optimistic temp message
    const tempMsg: MessageDTO = {
      id: `temp:${clientId}` as any,
      clientId,
      conversationId: selectedConv.id,
      sender: { userId: currentUserId, name: (user as any)?.name, avatar: (user as any)?.avatar } as any,
      content: text,
      createdAt: new Date().toISOString() as any,
      attachments: [], // required by MessageDTO type
      reactions: {},
      reactedByMe: false as any,
    };

    setMessages(prev => [...prev, tempMsg]);
    setInput("");
    scrollToBottomSmooth();

    try {
      const dto = await sendMessage(currentUserId, { conversationId: selectedConv.id, content: text, clientId });
      setMessages(prev => upsertMessage(prev, dto));

      // reorder conversations
      setConvs(prev => {
        const idx = prev.findIndex(c => c.id === selectedConv.id);
        if (idx < 0) return prev;
        const updated = { ...prev[idx], lastMessage: dto } as ConversationDTO;
        const rest = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return [updated, ...rest];
      });
    } catch (e) {
      console.error("[SEND] error", e);
      // rollback optimistic
      setMessages(prev => prev.filter(m => m.clientId !== clientId));
      message.error("Gửi tin nhắn thất bại");
    }
  };

  // ---------- Start / open direct chat ----------
  const startDirectChat = async (friendId: string) => {
    if (!currentUserId) return;
    try {
      const conv = await getOrCreateDirect(currentUserId, friendId);
      setConvs(prev => {
        const exists = prev.some(c => c.id === conv.id);
        const next = exists ? prev.map(c => (c.id === conv.id ? conv : c)) : [conv, ...prev];
        return next.sort((a, b) => byNewest(a.lastMessage?.createdAt ?? a.createdAt, b.lastMessage?.createdAt ?? b.createdAt));
      });
      setSelectedConv(conv);
      message.success("Đã mở hội thoại");
    } catch (e) {
      console.error("[DIRECT] open error", e);
      message.error("Không tạo được hội thoại");
    }
  };

  // ---------- Reactions ----------
  const toggleThumb = async (m: MessageDTO) => {
    if (!currentUserId) return;
    const has = (m.reactedByMe && m.reactions?.["👍"] > 0) || false;
    try {
      if (has) await removeReaction(m.id, currentUserId, "👍");
      else await addReaction(m.id, currentUserId, "👍");
      setMessages(prev => prev.map(x => x.id !== m.id ? x : {
        ...x,
        reactions: { ...x.reactions, "👍": has ? Math.max(0, (x.reactions?.["👍"] || 1) - 1) : (x.reactions?.["👍"] || 0) + 1 },
        reactedByMe: !has,
      }));
    } catch (e) {
      console.error("[REACTION] toggle error", e);
    }
  };

  // ---------- Infinite scroll up ----------
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop <= 0 && !loadingMsgs) loadOlder();
  };

  // ---------- Utils to render ----------
  const getConversationTitle = (c: ConversationDTO, myId: string) => {
    if (c.type === "DIRECT") return c.participants.find(p => p.userId !== myId)?.user?.name || "Direct";
    return c.title || "Nhóm";
  };
  const getConversationAvatar = (c: ConversationDTO, myId: string) => {
    if (c.type === "DIRECT") return c.participants.find(p => p.userId !== myId)?.user?.avatar;
    return (c as any).avatarUrl;
  };

  if (!currentUserId) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#888" }}>
        Vui lòng đăng nhập để sử dụng chat.
      </div>
    );
  }

  return (
    <div style={{
      height: "calc(100vh - 70px)", width: "100%", display: "flex", overflow: "hidden",
      background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)"
    }}>
      {/* Sidebar */}
      <div style={{
        width: "33%", maxWidth: 400, minWidth: 300, display: "flex", flexDirection: "column",
        borderRight: "1px solid #d0d7de", backgroundColor: "#fff"
      }}>
        <div style={{ padding: 16, borderBottom: "1px solid #d0d7de", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0 }}>Hội thoại</Title>
          </div>

          {/* Quick DM search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Select
              showSearch
              placeholder="Tìm bạn để chat"
              onSearch={(value: string) => setFriendQuery(value)}
              onChange={(friendId: string) => { setFriendQuery(""); startDirectChat(friendId); }}
              style={{ flex: 1 }}
              filterOption={false}
              notFoundContent={loadingFriends ? <LoadingOutlined /> : <Empty description="Không tìm thấy bạn bè" />}
              onDropdownVisibleChange={(open: boolean) => { if (open) loadFriends(0, false); }}
            >
              {filteredFriends.map((f) => (
                <Option key={f.userId} value={f.userId}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Avatar src={f.avatar} size={24} style={{ marginRight: 8 }} />
                    <span>{f.name || f.username}</span>
                  </div>
                </Option>
              ))}
            </Select>
            {!loadingFriends && friendsPage && !friendsPage.last && (
              <Button size="small" icon={<LoadingOutlined />} onClick={loadMoreFriends}>Thêm</Button>
            )}
          </div>

          {/* Conversation list header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px 8px" }}>
            <Text strong>Danh sách</Text>
            {!loadingConvs && convPage && !convPage.last && (
              <Button size="small" icon={<LoadingOutlined />} onClick={loadMoreConvs}>Tải thêm</Button>
            )}
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <List
              rowKey="id"
              loading={loadingConvs}
              dataSource={convs}
              locale={{ emptyText: <Empty description="Chưa có hội thoại" /> }}
              renderItem={(c) => {
                const last = c.lastMessage as any;
                const title = getConversationTitle(c, currentUserId!);
                const preview = last ? `${last.sender?.name ? last.sender.name + ": " : ""}${last.content ?? "[media]"}` : "Không có tin nhắn";
                return (
                  <List.Item
                    onClick={() => {
                      setSelectedConv(c);
                      setConvs(prev => prev.map(x => (x.id === c.id ? { ...x, unreadCount: 0 } : x)));
                    }}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      backgroundColor: selectedConv?.id === c.id ? "#e6f4ff" : "transparent",
                      borderBottom: "1px solid #f0f0f0",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (selectedConv?.id !== c.id) (e.currentTarget as any).style.backgroundColor = "#fafafa";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as any).style.backgroundColor = selectedConv?.id === c.id ? "#e6f4ff" : "transparent";
                    }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={getConversationAvatar(c, currentUserId!)}>{(title?.[0] ?? "?")}</Avatar>}
                      title={
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                          {(c as any).unreadCount > 0 && (
                            <Badge count={(c as any).unreadCount > 99 ? "99+" : (c as any).unreadCount} />
                          )}
                        </div>
                      }
                      description={
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#888" }}>
                          {preview}
                        </span>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Chat Pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #d0d7de", fontWeight: 600, backgroundColor: "#fff" }}>
          {selectedConv ? getConversationTitle(selectedConv, currentUserId!) : "Chọn hội thoại"}
        </div>

        <div
          ref={scrollBoxRef}
          onScroll={onScroll}
          style={{ flex: 1, overflowY: "auto", padding: 16, backgroundColor: "#fff" }}
        >
          {/* Lazy-load indicator at top while fetching older */}
          {loadingMsgs && messages.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Spin size="small" />
            </div>
          )}

          {loadingMsgs && messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#888" }}>Đang tải…</div>
          )}
          {hasMoreMsgs && messages.length > 0 && (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: 12 }}>Kéo lên để xem cũ hơn…</div>
          )}

          {messages.map((m, idx) => {
            const mine = m.sender ? currentUserId === (m.sender as any).userId : false;
            const pending = (m.id as any)?.toString?.().startsWith?.("temp:");
            const prev = idx > 0 ? messages[idx - 1] : undefined;
            const showMeta = shouldShowMeta(prev, m);
            return (
              <div key={m.id as any} style={{ marginBottom: 10, textAlign: mine ? "right" : "left", opacity: pending ? 0.6 : 1 }}>
                {showMeta && (
                  <Text style={{ display: "block", fontSize: 12, color: "#888", margin: mine ? "0 8px 4px 0" : "0 0 4px 8px" }}>
                    {(m.sender as any)?.name} · {formatHm((m as any).createdAt)}
                  </Text>
                )}

                {m.content && (
                  <div style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: mine ? "#1890ff" : "#f5f5f5",
                    color: mine ? "#fff" : "#000",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}>
                    {m.content}
                  </div>
                )}

                {m.attachments?.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "grid",
                      gridTemplateColumns: m.attachments.length > 1 ? "1fr 1fr" : "1fr",
                      gap: 8,
                    }}
                  >
                    {m.attachments.map((a) => (
                      <div key={(a as any).mediaId}>
                        <a href={(a as any).url} target="_blank" rel="noreferrer">
                          <img src={(a as any).thumbnailUrl || (a as any).url} alt="" style={{ width: "100%", borderRadius: 8 }} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 4, fontSize: 12, color: "#888", display: "flex", gap: 8, justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <Button size="small" type={m.reactedByMe ? "primary" : "default"} icon={<LikeOutlined />} onClick={() => toggleThumb(m)}>
                    {m.reactions?.["👍"] || 0}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div style={{ padding: 16, borderTop: "1px solid #d0d7de", display: "flex", alignItems: "center", gap: 8, backgroundColor: "#fff" }}>
          <Input
            placeholder={selectedConv ? "Nhập tin nhắn…" : "Chọn hội thoại để nhắn"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={onSend}
            disabled={!selectedConv}
            style={{ flex: 1 }}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={onSend} disabled={!selectedConv || !input.trim()}>
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
