// src/pages/ChatPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ConversationDTO,
  MessageDTO,
  getMyConversations,
  getMessages,
  sendMessage,
  markReadUpTo,
  addReaction,
  removeReaction,
} from "@/services/chatService";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { PageResponse, UserDto } from "@/interfaces";
import { useAuthStore } from "@/store/authStore";

const PAGE_SIZE_CONV = 20;
const PAGE_SIZE_MSG = 30;

const ChatPage: React.FC = () => {
  const user = useAuthStore((s) => s.user) as UserDto | null;
  const currentUserId = user?.userId; // <— string | undefined (KHÔNG phải UserDto)

  // ===== Conversations =====
  const [convPage, setConvPage] = useState<PageResponse<ConversationDTO> | null>(null);
  const [convs, setConvs] = useState<ConversationDTO[]>([]);
  const [convPageIndex, setConvPageIndex] = useState(0);
  const [selectedConv, setSelectedConv] = useState<ConversationDTO | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // ===== Messages =====
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [input, setInput] = useState("");
  const scrollBoxRef = useRef<HTMLDivElement | null>(null);

  // ===== Realtime (optional) =====
  const stompRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);

  const oldestId = useMemo(() => (messages.length ? messages[0].id : undefined), [messages]);
  // const newestId = useMemo(() => (messages.length ? messages[messages.length - 1].id : undefined), [messages]); // nếu chưa dùng có thể xoá

  useEffect(() => {
    if (!currentUserId) return; // gác tới khi có ID
    (async () => {
      setLoadingConvs(true);
      try {
        const page = await getMyConversations(currentUserId, 0, PAGE_SIZE_CONV);
        setConvPage(page);
        setConvs(page.content);
        if (page.content.length && !selectedConv) setSelectedConv(page.content[0]);
      } finally {
        setLoadingConvs(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const loadMoreConvs = async () => {
    if (!currentUserId || !convPage || convPage.last || loadingConvs) return;
    const next = convPageIndex + 1;
    setLoadingConvs(true);
    try {
      const page = await getMyConversations(currentUserId, next, PAGE_SIZE_CONV);
      setConvPage(page);
      setConvPageIndex(next);
      setConvs((prev) => [...prev, ...page.content]);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    if (!selectedConv || !currentUserId) return;
    setMessages([]);
    setHasMoreMsgs(true);
    (async () => {
      setLoadingMsgs(true);
      try {
        const page = await getMessages({
          conversationId: selectedConv.id,
          me: currentUserId,
          size: PAGE_SIZE_MSG,
        });
        const arr = [...page.content].reverse();
        setMessages(arr);
        setHasMoreMsgs(!page.last);
        setTimeout(() => scrollToBottom(), 0);
        if (arr.length) {
          await markReadUpTo(selectedConv.id, arr[arr.length - 1].id, currentUserId);
        }
      } finally {
        setLoadingMsgs(false);
      }
    })();

    // Realtime subscribe
    setupRealtime(selectedConv.id);

    return () => {
      try {
        subscriptionRef.current?.unsubscribe();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id, currentUserId]);

  const setupRealtime = (conversationId: string) => {
    if (!stompRef.current) {
      const client = new Client({
        webSocketFactory: () => new SockJS("/chat-ws"),
        reconnectDelay: 2000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          subscriptionRef.current = client.subscribe(`/chat-topic/conv.${conversationId}`, (msg: IMessage) => {
            try {
              const payload = JSON.parse(msg.body);
              if (payload && payload.id) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === payload.id)) return prev;
                  const next = [...prev, payload];
                  if (isNearBottom()) setTimeout(() => scrollToBottomSmooth(), 0);
                  return next;
                });
              }
            } catch (e) {
              console.warn("WS parse error", e);
            }
          });
        },
      });
      client.activate();
      stompRef.current = client;
    } else {
      try {
        subscriptionRef.current?.unsubscribe();
      } catch {}
      subscriptionRef.current = stompRef.current.subscribe(`/chat-topic/conv.${conversationId}`, (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body);
          if (payload && payload.id) {
            setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
          }
        } catch {}
      });
    }
  };

  const loadOlder = async () => {
    if (!selectedConv || !currentUserId || !hasMoreMsgs || loadingMsgs || !oldestId) return;
    setLoadingMsgs(true);
    try {
      const page = await getMessages({
        conversationId: selectedConv.id,
        me: currentUserId,
        beforeMessageId: oldestId,
        size: PAGE_SIZE_MSG,
      });
      const moreAsc = [...page.content].reverse();
      setMessages((prev) => [...moreAsc, ...prev]);
      setHasMoreMsgs(!page.last);
      preserveScrollAfterPrepend(moreAsc.length);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text || !selectedConv || !currentUserId) return;
    try {
      const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const dto = await sendMessage(currentUserId, {
        conversationId: selectedConv.id,
        content: text,
        clientId,
      });
      setMessages((prev) => (prev.some((m) => m.id === dto.id) ? prev : [...prev, dto]));
      setInput("");
      scrollToBottomSmooth();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleThumb = async (m: MessageDTO) => {
    if (!currentUserId) return;
    const has = (m.reactedByMe && m.reactions?.["👍"] > 0) || false;
    try {
      if (has) await removeReaction(m.id, currentUserId, "👍");
      else await addReaction(m.id, currentUserId, "👍");

      setMessages((prev) =>
        prev.map((x) => {
          if (x.id !== m.id) return x;
          const count = x.reactions?.["👍"] || 0;
          const nextCount = has ? Math.max(0, count - 1) : count + 1;
          return {
            ...x,
            reactions: { ...x.reactions, "👍": nextCount },
            reactedByMe: !has,
          };
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ===== scroll helpers =====
  const scrollToBottom = () => {
    const box = scrollBoxRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  };
  const scrollToBottomSmooth = () => {
    const box = scrollBoxRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  };
  const isNearBottom = () => {
    const box = scrollBoxRef.current;
    if (!box) return false;
    return box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  };
  const preserveScrollAfterPrepend = (_addedCount: number) => {
    const box = scrollBoxRef.current;
    if (!box) return;
    box.scrollTop = 1;
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop <= 0 && !loadingMsgs) loadOlder();
  };

  // ⛔ Chưa đăng nhập → không có userId
  if (!currentUserId) {
    return <div className="p-6 text-sm text-gray-600">Vui lòng đăng nhập để sử dụng chat.</div>;
  }

  return (
    <div className="w-full h-screen flex overflow-hidden">
      {/* Sidebar Conversations */}
      <div className="w-80 border-r h-full flex flex-col">
        <div className="p-3 border-b font-semibold">Hội thoại</div>
        <div className="flex-1 overflow-auto">
          {convs.map((c) => {
            const last = c.lastMessage;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedConv(c)}
                className={`w-full text-left px-3 py-2 border-b hover:bg-gray-50 ${
                  selectedConv?.id === c.id ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="font-medium flex-1">
                    {c.type === "DIRECT"
                      ? c.participants.find((p) => p.userId !== currentUserId)?.user?.name ?? "Direct"
                      : c.title ?? "Nhóm"}
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="text-xs bg-black text-white rounded-full px-2 py-[2px]">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
                {last && (
                  <div className="text-xs text-gray-500 truncate">
                    {last.sender?.name ? `${last.sender.name}: ` : ""}
                    {last.content ?? "[media]"}
                  </div>
                )}
              </button>
            );
          })}
          {!loadingConvs && convPage && !convPage.last && (
            <div className="p-3">
              <button className="w-full border rounded-lg py-2" onClick={loadMoreConvs}>
                Tải thêm…
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Pane */}
      <div className="flex-1 h-full flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            {selectedConv
              ? selectedConv.type === "DIRECT"
                ? selectedConv.participants.find((p) => p.userId !== currentUserId)?.user?.name ?? "Direct"
                : selectedConv.title ?? "Nhóm"
              : "Chọn hội thoại"}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollBoxRef} className="flex-1 overflow-auto px-4 py-3 bg-white" onScroll={onScroll}>
          {loadingMsgs && messages.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-4">Đang tải…</div>
          )}
          {hasMoreMsgs && messages.length > 0 && (
            <div className="text-center text-xs text-gray-400 my-2">Kéo lên để xem cũ hơn…</div>
          )}

          {messages.map((m) => {
            const mine = m.sender?.userId === currentUserId;
            return (
              <div key={m.id} className={`mb-3 ${mine ? "text-right" : "text-left"}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {m.sender?.name} · {new Date(m.createdAt).toLocaleTimeString()}
                </div>
                {m.content && (
                  <div
                    className={`inline-block px-3 py-2 rounded-2xl ${
                      mine ? "bg-black text-white" : "bg-gray-100"
                    }`}
                    style={{ maxWidth: 560, wordBreak: "break-word" }}
                  >
                    {m.content}
                  </div>
                )}
                {m.attachments?.length > 0 && (
                  <div
                    className={`mt-2 grid gap-2 ${
                      m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {m.attachments.map((a) => (
                      <a key={a.mediaId} href={a.url} target="_blank" rel="noreferrer">
                        <img src={a.thumbnailUrl || a.url} alt="" className="rounded-lg max-h-60 object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500 flex items-center gap-2 justify-end">
                  <button className="px-2 py-1 rounded hover:bg-gray-100" onClick={() => toggleThumb(m)}>
                    👍 {(m.reactions && m.reactions["👍"]) ? m.reactions["👍"] : 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 border-t flex items-center gap-2">
          <input
            className="flex-1 border rounded-xl px-3 py-2"
            placeholder={selectedConv ? "Nhập tin nhắn…" : "Chọn hội thoại để nhắn"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            disabled={!selectedConv}
          />
          <button
            className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
            onClick={onSend}
            disabled={!selectedConv || !input.trim()}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
