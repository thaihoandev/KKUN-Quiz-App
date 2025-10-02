import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import Tooltip from 'bootstrap/js/dist/tooltip';  // chỉ import Tooltip

const PAGE_SIZE_CONV = 20;
const PAGE_SIZE_MSG = 30;
const PAGE_SIZE_FRIENDS = 20;
const SHOW_META_GAP_MS = 60 * 1000;
const TIME_SEPARATOR_GAP_MS = 15 * 60 * 1000;

const WS_ENDPOINT: string = (import.meta as any).env?.VITE_WS_URL || "/ws";

type Msg = MessageDTO & { myReaction?: string | null };

const EMOJI_CHOICES = [
  "👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🔥", "🎉", "🙏"
];

function byNewest(aTime?: string, bTime?: string) {
  const ta = new Date(aTime ?? 0).getTime();
  const tb = new Date(bTime ?? 0).getTime();
  return tb - ta;
}

function upsertMessage(list: Msg[], incoming: Msg): Msg[] {
  if (!incoming) return list;

  const mergePreserve = (oldMsg: Msg | undefined, inc: Msg): Msg => {
    if (!oldMsg) return inc;
    if (inc.myReaction === undefined) inc = { ...inc, myReaction: oldMsg.myReaction };
    return inc;
  };

  if (incoming.clientId) {
    const i = list.findIndex(m => m.clientId === incoming.clientId);
    if (i >= 0) {
      const next = list.slice();
      next[i] = mergePreserve(list[i], incoming);
      return next;
    }
  }
  const j = list.findIndex(m => m.id === incoming.id);
  if (j >= 0) {
    const next = list.slice();
    next[j] = mergePreserve(list[j], incoming);
    return next;
  }
  return [...list, incoming];
}

function formatHm(ts: any) {
  try {
    return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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

function shouldShowTimeSeparator(prev: MessageDTO | undefined, curr: MessageDTO): boolean {
  if (!prev || !curr) return false;
  const prevAt = new Date((prev as any).createdAt ?? 0).getTime();
  const currAt = new Date((curr as any).createdAt ?? 0).getTime();
  return (currAt - prevAt) >= TIME_SEPARATOR_GAP_MS;
}

const ChatPage: React.FC = () => {
  const user = useAuthStore((s) => s.user) as UserDto | null;
  const currentUserId = user?.userId;

  const [convPage, setConvPage] = useState<PageResponse<ConversationDTO> | null>(null);
  const [convs, setConvs] = useState<ConversationDTO[]>([]);
  const [convPageIndex, setConvPageIndex] = useState(0);
  const [selectedConv, setSelectedConv] = useState<ConversationDTO | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(false);

  const [friends, setFriends] = useState<UserResponseDTO[]>([]);
  const [friendsPage, setFriendsPage] = useState<PageResponse<UserResponseDTO> | null>(null);
  const [friendPageIndex, setFriendPageIndex] = useState(0);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [friendDropdownOpen, setFriendDropdownOpen] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [input, setInput] = useState("");
  const scrollBoxRef = useRef<HTMLDivElement | null>(null);

  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "danger"; text: string } | null>(null);
  const showToast = (type: "success" | "danger", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2000);
  };

  const stompRef = useRef<Client | null>(null);
  const topicSubRef = useRef<any>(null);
  const inboxSubRef = useRef<any>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  const autoScrollToBottomRef = useRef<boolean>(false);

  const oldestId = useMemo(() => (messages.length ? (messages[0].id as any) : undefined), [messages]);

  // Initialize Bootstrap tooltips
  useEffect(() => {
    const els = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltips = Array.from(els).map(el =>
      new Tooltip(el as Element, {
        container: 'body',
        offset: [0, 8],
      })
    );
    return () => { tooltips.forEach(t => t.dispose()); };
  }, [messages]);

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

  useEffect(() => {
    if (!autoScrollToBottomRef.current) return;
    requestAnimationFrame(() => {
      scrollToBottom();
      setTimeout(scrollToBottom, 0);
    });
    autoScrollToBottomRef.current = false;
  }, [messages, selectedConv?.id]);

  const subscribeConversationTopic = (client: Client, conversationId: string) => {
    try {
      topicSubRef.current?.unsubscribe?.();
      topicSubRef.current = client.subscribe(`/topic/conv.${conversationId}`, (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body) as Msg;
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

  const ensureStompClient = useCallback(() => {
    if (stompRef.current) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });


    client.onConnect = (_frame: IFrame) => {
      try { inboxSubRef.current?.unsubscribe?.(); } catch {}
      inboxSubRef.current = client.subscribe("/user/queue/inbox", async (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body);
          if (payload?.type !== "NEW_MESSAGE" || !payload?.message) return;
          const dto = payload.message as Msg;
          const convId = dto.conversationId as any;
          const activeId = selectedConvIdRef.current;

          if (activeId === convId) {
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
    if (!q) return [] as UserResponseDTO[];
    return friends.filter((f) => [f.name, f.username, f.email].filter(Boolean).some((s) => (s as string).toLowerCase().includes(q)));
  }, [friendQuery, friends]);

  useEffect(() => {
    if (!selectedConv || !currentUserId) return;

    setMessages([]);
    setHasMoreMsgs(true);

    (async () => {
      setLoadingMsgs(true);
      try {
        const page = await getMessages({ conversationId: selectedConv.id, me: currentUserId, size: PAGE_SIZE_MSG });
        const arr = [...page.content].reverse();
        setMessages(arr as Msg[]);
        setHasMoreMsgs(!page.last);
        autoScrollToBottomRef.current = true;
        if (arr.length) await markReadUpTo(selectedConv.id, (arr[arr.length - 1] as any).id, currentUserId);
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

  const loadOlder = async () => {
    if (!selectedConv || !currentUserId || !hasMoreMsgs || loadingMsgs || !oldestId) return;
    setLoadingMsgs(true);
    try {
      const page = await getMessages({ conversationId: selectedConv.id, me: currentUserId, beforeMessageId: oldestId, size: PAGE_SIZE_MSG });
      const moreAsc = [...page.content].reverse();
      setMessages(prev => [...(moreAsc as Msg[]), ...prev]);
      setHasMoreMsgs(!page.last);
      preserveScrollAfterPrepend();
    } finally {
      setLoadingMsgs(false);
    }
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text || !selectedConv || !currentUserId) return;

    const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 1) Optimistic UI
    const tempMsg: Msg = {
      id: `temp:${clientId}` as any,
      clientId,
      conversationId: selectedConv.id,
      sender: { userId: currentUserId, name: (user as any)?.name, avatar: (user as any)?.avatar } as any,
      content: text,
      createdAt: new Date().toISOString() as any,
      attachments: [],
      reactions: {},
      reactedByMe: false as any,
      myReaction: null,
    };

    setMessages(prev => [...prev, tempMsg]);
    setInput("");
    scrollToBottomSmooth();

    try {
      // 2) Gọi API (async, 202 Accepted)
      await sendMessage(currentUserId, {
        conversationId: selectedConv.id,
        content: text,
        clientId,
      });

      // 3) KHÔNG upsert từ dto trả về nữa.
      //    Chờ event realtime từ:
      //    - /user/queue/inbox (payload.type === "NEW_MESSAGE")
      //      hoặc
      //    - /topic/conv.{conversationId}
      //    Event sẽ mang MessageDTO có cùng clientId → upsertMessage() đã xử lý.

      // 4) Có thể cập nhật tạm convs (tuỳ thích), nhưng tốt nhất cũng đợi event.
      // setConvs(...)  // bỏ qua

    } catch (e) {
      console.error("[SEND] error", e);
      // Rollback optimistic nếu fail enqueue
      setMessages(prev => prev.filter(m => m.clientId !== clientId));
      showToast("danger", "Gửi tin nhắn thất bại");
    }
  };


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
      showToast("success", "Đã mở hội thoại");
    } catch (e) {
      console.error("[DIRECT] open error", e);
      showToast("danger", "Không tạo được hội thoại");
    }
  };

  const selectReaction = async (m: Msg, emoji: string) => {
    if (!currentUserId) return;
    const prevEmoji = m.myReaction || null;

    if (prevEmoji === emoji) {
      try { await removeReaction(m.id, currentUserId, emoji); } catch (e) { console.warn(e); }
      setMessages(list => list.map(x => {
        if (x.id !== m.id) return x;
        const nextCounts = { ...(x.reactions || {}) } as Record<string, number>;
        nextCounts[emoji] = Math.max(0, (nextCounts[emoji] || 1) - 1);
        return { ...x, myReaction: null, reactedByMe: false as any, reactions: nextCounts };
      }));
      return;
    }

    try {
      if (prevEmoji) {
        try { await removeReaction(m.id, currentUserId, prevEmoji); } catch (e) { console.warn(e); }
      }
      await addReaction(m.id, currentUserId, emoji);

      setMessages(list => list.map(x => {
        if (x.id !== m.id) return x;
        const nextCounts = { ...(x.reactions || {}) } as Record<string, number>;
        if (prevEmoji) nextCounts[prevEmoji] = Math.max(0, (nextCounts[prevEmoji] || 1) - 1);
        nextCounts[emoji] = (nextCounts[emoji] || 0) + 1;
        return { ...x, myReaction: emoji, reactedByMe: true as any, reactions: nextCounts };
      }));
    } catch (e) {
      console.error("[REACTION] set error", e);
      showToast("danger", "Không thể cập nhật cảm xúc");
    }
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop <= 0 && !loadingMsgs) loadOlder();
  };

  const getConversationTitle = (c: ConversationDTO, myId: string) => {
    if ((c as any).type === "DIRECT") return c.participants.find(p => p.userId !== myId)?.user?.name || "Direct";
    return (c as any).title || "Nhóm";
  };
  const getConversationAvatar = (c: ConversationDTO, myId: string) => {
    if ((c as any).type === "DIRECT") return c.participants.find(p => p.userId !== myId)?.user?.avatar;
    return (c as any).avatarUrl;
  };

  const isLastInMetaGroup = (currIdx: number) => {
    if (currIdx >= messages.length - 1) return true;
    const curr = messages[currIdx];
    const next = messages[currIdx + 1];
    return shouldShowMeta(curr, next);
  };

  if (!currentUserId) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#888" }}>
        Vui lòng đăng nhập để sử dụng chat.
      </div>
    );
  }

  return (
    <div
      style={{
        height: "calc(100vh - 70px)",
        width: "100%",
        display: "flex",
        overflow: "hidden",
        background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)"
      }}
    >
      {/* Sidebar */}
      <div className="d-flex flex-column bg-white border-end" style={{ width: "33%", maxWidth: 400, minWidth: 300 }}>
        <div className="d-flex flex-column h-100 p-3">
          <div className="mb-3">
            <h4 className="m-0">Hội thoại</h4>
          </div>

          <div className="mb-3 position-relative">
            <div className="input-group">
              <span className="input-group-text">🔎</span>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm bạn để chat"
                value={friendQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFriendQuery(e.target.value)}
                onFocus={() => setFriendDropdownOpen(true)}
                onBlur={() => setTimeout(() => setFriendDropdownOpen(false), 120)}
              />
              {friendDropdownOpen && friendsPage && !friendsPage.last && (
                <button
                  className="btn btn-outline-secondary"
                  onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                  onClick={loadMoreFriends}
                >
                  Thêm
                </button>
              )}
            </div>

            {friendDropdownOpen && friendQuery.trim().length === 0 && (
              <div className="position-absolute w-100 mt-1 p-2 bg-white border rounded-3 shadow-sm text-muted small">
                Nhập tên để tìm bạn…
              </div>
            )}

            {friendDropdownOpen && friendQuery.trim().length > 0 && (
              <div className="position-absolute w-100 mt-1 bg-white border rounded-3 shadow-sm" style={{ maxHeight: 280, overflowY: "auto", zIndex: 10 }}>
                {loadingFriends && (
                  <div className="d-flex align-items-center justify-content-center py-2">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    <span className="small text-muted">Đang tải…</span>
                  </div>
                )}
                {!loadingFriends && filteredFriends.length === 0 && (
                  <div className="p-2 text-muted small">Không tìm thấy bạn bè</div>
                )}
                <ul className="list-group list-group-flush">
                  {filteredFriends.map((f) => (
                    <li
                      key={f.userId}
                      className="list-group-item list-group-item-action d-flex align-items-center"
                      style={{ cursor: "pointer" }}
                      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                      onClick={() => {
                        setFriendQuery("");
                        setFriendDropdownOpen(false);
                        startDirectChat(f.userId);
                      }}
                    >
                      <img
                        src={f.avatar || ""}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
                        className="rounded-circle me-2"
                        style={{ width: 24, height: 24, objectFit: "cover" }}
                        alt=""
                      />
                      <span>{f.name || f.username}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center px-2 pb-2">
            <strong>Danh sách</strong>
            {!loadingConvs && convPage && !convPage.last && (
              <button className="btn btn-sm btn-outline-secondary" onClick={loadMoreConvs}>
                Tải thêm
              </button>
            )}
          </div>

          <div className="flex-grow-1 overflow-auto">
            {loadingConvs && convs.length === 0 && (
              <div className="text-center text-muted py-3">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Đang tải…
              </div>
            )}
            {!loadingConvs && convs.length === 0 && (
              <div className="text-center text-muted py-3">Chưa có hội thoại</div>
            )}
            <ul className="list-group">
              {convs.map((c) => {
                const last = c.lastMessage as any;
                const title = getConversationTitle(c, currentUserId!);
                const preview = last ? `${last.sender?.name ? last.sender.name + ": " : ""}${last.content ?? "[media]"}` : "Không có tin nhắn";
                const active = selectedConv?.id === c.id;
                return (
                  <li
                    key={c.id}
                    className={`list-group-item ${active ? "active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedConv(c);
                      setConvs(prev => prev.map(x => (x.id === c.id ? { ...x, unreadCount: 0 } : x)));
                    }}
                  >
                    <div className="d-flex align-items-start">
                      {getConversationAvatar(c, currentUserId!) ? (
                        <img
                          src={getConversationAvatar(c, currentUserId!)!}
                          alt=""
                          className={`rounded-circle me-2 ${active ? "border border-light" : ""}`}
                          style={{ width: 36, height: 36, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className={`rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2 ${active ? "border border-light" : ""}`}
                          style={{ width: 36, height: 36 }}
                        >
                          {title?.[0] ?? "?"}
                        </div>
                      )}
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <div
                            className={`fw-semibold ${active ? "text-white" : ""}`}
                            style={{ maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {title}
                          </div>
                          {(c as any).unreadCount > 0 && (
                            <span className={`badge rounded-pill ${active ? "bg-light text-dark" : "bg-primary"}`}>
                              {(c as any).unreadCount > 99 ? "99+" : (c as any).unreadCount}
                            </span>
                          )}
                        </div>
                        <div
                          className={`small ${active ? "text-white-50" : "text-muted"}`}
                          style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {preview}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column flex-grow-1">
        <div className="p-3 border-bottom bg-white fw-semibold">
          {selectedConv ? getConversationTitle(selectedConv, currentUserId!) : "Chọn hội thoại"}
        </div>

        <div
          ref={scrollBoxRef}
          onScroll={onScroll}
          className="flex-grow-1 overflow-auto p-3 bg-white"
        >
          <style>{`
            .message-container:hover .reaction-button {
              opacity: 1 !important;
            }
            .tooltip {
              z-index: 2000 !important; /* Ensure tooltip is above other elements */
            }
          `}</style>

          {loadingMsgs && messages.length === 0 && (
            <div className="text-center text-muted">Đang tải…</div>
          )}
          {hasMoreMsgs && messages.length > 0 && (
            <div className="text-center text-muted small">Kéo lên để xem cũ hơn…</div>
          )}

          {messages.map((m, idx) => {
            const mine = m.sender ? currentUserId === (m.sender as any).userId : false;
            const pending = (m.id as any)?.toString?.().startsWith?.("temp:");
            const prev = idx > 0 ? messages[idx - 1] : undefined;
            const showMeta = shouldShowMeta(prev, m);
            const showSeparator = shouldShowTimeSeparator(prev, m);
            const isLast = isLastInMetaGroup(idx);
            const hasReactions = Object.entries(m.reactions || {}).some(([_, count]) => (count as number) > 0);

            return (
              <React.Fragment key={m.id as any}>
                {showSeparator && (
                  <div className="text-center small text-muted my-3">
                    {formatHm((m as any).createdAt)}
                  </div>
                )}
                <div
                  className={`message-container mb-${isLast ? 3 : 1} ${mine ? "d-flex justify-content-end" : "d-flex justify-content-start"}`}
                  style={{ opacity: pending ? 0.6 : 1 }}
                >
                  {!mine && (
                    <div
                      style={{ width: 32, marginRight: 8, alignSelf: isLast ? "flex-end" : "flex-start" }}
                    >
                      {isLast && (
                        <img
                          src={(m.sender as any)?.avatar || ""}
                          alt=""
                          className="rounded-circle"
                          style={{ width: 32, height: 32, objectFit: "cover" }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </div>
                  )}
                  <div className="d-flex align-items-center" style={{ maxWidth: "70%", position: "relative" }}>
                    <div
                      className={`position-relative ${mine ? "order-0 me-2" : "order-2 ms-2"} reaction-button`}
                      style={{ opacity: 0, transition: "opacity 0.2s" }}
                    >
                      <button
                        className={`btn btn-sm p-0 px-2 ${m.myReaction ? "text-primary" : "text-secondary"}`}
                        style={{ fontSize: "1.2em" }}
                        onClick={() => setPickerFor(pickerFor === (m.id as any) ? null : (m.id as any))}
                        onBlur={() => setTimeout(() => setPickerFor(cur => cur === (m.id as any) ? null : cur), 120)}
                        title={m.myReaction ? `Cảm xúc của bạn: ${m.myReaction}` : "Chọn cảm xúc"}
                      >
                        ☺
                      </button>
                      {pickerFor === (m.id as any) && (
                        <div
                          className="position-absolute bg-white border rounded-3 shadow-sm p-2"
                          style={{ zIndex: 10, top: "100%", left: 0 }}
                        >
                          <div className="d-flex flex-wrap gap-1" style={{ maxWidth: 240 }}>
                            {EMOJI_CHOICES.map((emo) => (
                              <button
                                key={emo}
                                className={`btn btn-sm ${m.myReaction === emo ? "btn-primary" : "btn-outline-secondary"}`}
                                onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                                onClick={() => { selectReaction(m, emo); setPickerFor(null); }}
                              >
                                {emo}
                              </button>
                            ))}
                            {m.myReaction && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                                onClick={() => { selectReaction(m, m.myReaction!); setPickerFor(null); }}
                              >
                                Bỏ
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`order-${mine ? 1 : 1}`}>
                      {!mine && showMeta && (
                        <div className="small text-muted mb-1 text-start">
                          {(m.sender as any)?.name}
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-3 ${mine ? "bg-primary text-white" : "bg-light"}`}
                        style={{ wordBreak: "break-word" }}
                        data-bs-toggle="tooltip"
                        data-bs-placement={mine ? "left" : "right"}
                        data-bs-title={formatHm((m as any).createdAt)}
                        data-bs-container="body"
                      >
                        {m.content && <div>{m.content}</div>}
                      </div>
                      {m.attachments?.length > 0 && (
                        <div
                          className="mt-2"
                          style={{ display: "grid", gridTemplateColumns: m.attachments.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}
                        >
                          {m.attachments.map((a) => (
                            <div key={(a as any).mediaId}>
                              <a href={(a as any).url} target="_blank" rel="noreferrer">
                                <img
                                  src={(a as any).thumbnailUrl || (a as any).url}
                                  alt=""
                                  style={{ width: "100%", borderRadius: 8 }}
                                />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                      {hasReactions && (
                        <div
                          className={`small d-flex gap-1 ${mine ? "justify-content-end" : "justify-content-start"}`}
                          style={{ position: "sticky", top: 0, marginTop: 4, zIndex: 5 }}
                        >
                          {Object.entries(m.reactions || {})
                            .filter(([_, count]) => (count as number) > 0)
                            .map(([emoji, count]) => (
                              <button
                                key={emoji}
                                className={`btn btn-sm p-0 px-1 ${m.myReaction === emoji ? "text-primary" : "text-secondary"}`}
                                style={{ fontSize: "0.8em" }}
                                onClick={() => selectReaction(m, emoji)}
                              >
                                {emoji} {count as number > 1 ? count : ""}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="p-3 border-top bg-white d-flex align-items-center gap-2">
          <input
            className="form-control"
            placeholder={selectedConv ? "Nhập tin nhắn…" : "Chọn hội thoại để nhắn"}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") onSend(); }}
            disabled={!selectedConv}
          />
          <button
            className="btn btn-primary"
            onClick={onSend}
            disabled={!selectedConv || !input.trim()}
          >
            Gửi
          </button>
        </div>
      </div>

      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className={`alert alert-${toast.type} shadow-sm mb-0`} role="alert">
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;