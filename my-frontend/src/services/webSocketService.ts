// src/services/WebSocketService.ts
import * as StompJs from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { PostDTO } from "@/services/postService";
import { NotificationDTO } from "@/services/notificationService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { buildNotificationText } from "@/utils/notificationText";

interface AppNotification {
  id: string;    // UUID gốc
  title: string; // cùng nội dung với message (để dùng chỗ khác nếu cần)
  message: string;
  time: string;  // toLocaleString
  avatar?: string;
}

type PostUpdateCallback = (post: PostDTO) => void;
type NotificationCallback = (notification: AppNotification) => void;

// Debug helper
const DEBUG = String(import.meta.env.VITE_WS_DEBUG).toLowerCase() === "true";
const tag = "[WS]";
const log = {
  debug: (...args: any[]) => DEBUG && console.debug(tag, ...args),
  info:  (...args: any[]) => console.info(tag, ...args),
  warn:  (...args: any[]) => console.warn(tag, ...args),
  error: (...args: any[]) => console.error(tag, ...args),
};
const maskToken = (t?: string | null) => (t ? `${t.slice(0, 8)}…${t.slice(-6)}` : "(none)");

export class WebSocketService {
  private client: StompJs.Client | null = null;
  private postUpdateCallbacks: Map<string, PostUpdateCallback[]> = new Map();
  private notificationCallbacks: NotificationCallback[] = [];
  private isConnected = false;
  private accessToken: string | null = null;
  private notificationSubscription: StompJs.StompSubscription | null = null;

  constructor(accessToken: string | null) {
    this.accessToken = accessToken;
    log.info("Ctor: initializing client. Token:", maskToken(this.accessToken));
    this.connect();
  }

  /** Kết nối SockJS + STOMP. Nếu token null (cookie HttpOnly), backend sẽ đọc từ cookie handshake. */
  private connect() {
    const WS_ENDPOINT = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";
    log.info("Connecting to", WS_ENDPOINT);

    const socket = new SockJS(WS_ENDPOINT);
    socket.onopen = () => log.debug("SockJS open");
    socket.onclose = (e: any) => log.debug("SockJS closed:", e?.code, e?.reason);
    socket.onerror = (e: any) => log.warn("SockJS error:", e);

    this.client = new StompJs.Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
    });

    this.client.onConnect = (frame) => {
      this.isConnected = true;
      log.info("Connected. Server headers:", frame?.headers);
      this.resubscribeAll();
    };

    this.client.onStompError = (frame) => {
      log.error("STOMP error:", frame.headers["message"], frame.body);
      this.isConnected = false;
    };

    this.client.onWebSocketClose = (evt) => {
      log.warn("WebSocket closed:", evt?.code, evt?.reason);
      this.isConnected = false;
      this.notificationSubscription = null;
    };

    this.client.onWebSocketError = (evt) => {
      log.warn("WebSocket error event:", evt);
    };

    this.client.activate();
    log.debug("Client.activate() called");
  }

  /** Re-subscribe các kênh cần thiết sau khi connect/reconnect */
  private resubscribeAll() {
    log.info("Resubscribe all channels…");

    if (this.client && this.isConnected) {
      if (this.notificationSubscription) {
        log.debug("Unsubscribe old notifications subscription");
        this.notificationSubscription.unsubscribe();
        this.notificationSubscription = null;
      }

      log.info('Subscribing to "/user/queue/notifications"');
      this.notificationSubscription = this.client.subscribe(
        "/user/queue/notifications",
        (message) => {
          log.debug("Message received. Headers:", message.headers);
          try {
            const dto: NotificationDTO = JSON.parse(message.body);
            log.debug("Parsed NotificationDTO:", dto);

            const createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
            const text = buildNotificationText(dto); // ✅ dùng formatter đẹp

            const mapped: AppNotification = {
              id: String(dto.notificationId ?? `${Date.now()}`),
              title: text,
              message: text,
              time: createdAt.toLocaleString(),
              avatar: dto.actor?.avatar || unknownAvatar,
            };

            log.debug("Mapped notification:", mapped);

            // Gửi cho các callback UI
            this.notificationCallbacks.forEach((cb, i) => {
              try {
                cb(mapped);
              } catch (e) {
                log.warn(`Notification callback[${i}] threw:`, e);
              }
            });

            // Browser Notification (optional)
            if ("Notification" in window) {
              if (window.Notification.permission === "granted") {
                new window.Notification(this.stripHtml(mapped.message), {
                  body: dto.targetId ? `Target: ${dto.targetId}` : undefined,
                  icon: mapped.avatar,
                });
              } else if (window.Notification.permission !== "denied") {
                window.Notification.requestPermission().then((perm) => {
                  if (perm === "granted") {
                    new window.Notification(this.stripHtml(mapped.message), {
                      body: dto.targetId ? `Target: ${dto.targetId}` : undefined,
                      icon: mapped.avatar,
                    });
                  }
                });
              }
            }
          } catch (e) {
            log.error("Error parsing notification:", e, "Body:", message.body);
          }
        }
      );
    } else {
      log.warn("Cannot subscribe: client not connected");
    }
  }

  private stripHtml(s: string) {
    const tmp = document.createElement("div");
    tmp.innerHTML = s;
    return tmp.textContent || tmp.innerText || "";
  }

  public registerNotificationCallback(callback: NotificationCallback) {
    if (!this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
      log.debug("Registered notification callback. Total:", this.notificationCallbacks.length);
    }
  }

  public unregisterNotificationCallback(callback: NotificationCallback) {
    this.notificationCallbacks = this.notificationCallbacks.filter((cb) => cb !== callback);
    log.debug("Unregistered notification callback. Total:", this.notificationCallbacks.length);
  }

  /** Set/reload token -> reconnect để gửi CONNECT với Authorization header mới */
  public setToken(token: string | null) {
    const changed = token !== this.accessToken;
    log.info("setToken called. Changed:", changed, "New token:", maskToken(token));
    this.accessToken = token;

    if (!this.client) {
      this.connect();
      return;
    }

    if (changed) {
      try {
        log.info("Deactivating client to reconnect with new token…");
        this.client.deactivate().then(() => {
          log.info("Client deactivated. Reconnecting…");
          this.connect();
        });
      } catch (e) {
        log.warn("client.deactivate() threw, reconnecting anyway:", e);
        this.connect();
      }
    }
  }

  public disconnect() {
    if (this.client) {
      log.info("Disconnect requested");
      try {
        this.client.deactivate();
      } finally {
        this.isConnected = false;
        this.notificationSubscription = null;
        log.info("Disconnected");
      }
    } else {
      log.debug("Disconnect called but no client instance");
    }
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton tiện dùng toàn app
export const webSocketService = new WebSocketService(null);

// Helper cho app
export const setWebSocketToken = (accessToken: string | null) => {
  log.info("setWebSocketToken helper received token:", maskToken(accessToken));
  webSocketService.setToken(accessToken);
};

// (Legacy) Giữ API cũ để không vỡ code — per-user mode không cần userId
export const setWebSocketUserId = (_userId: string | null) => {
  log.debug("setWebSocketUserId called (no-op in per-user mode):", _userId);
};
