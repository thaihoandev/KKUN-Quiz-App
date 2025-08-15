// src/components/layout/NotificationHeader.tsx
import React, { useEffect, useState, useRef, UIEvent } from "react";
import { webSocketService, setWebSocketToken } from "@/services/webSocketService";
import { getNotifications, NotificationDTO } from "@/services/notificationService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { getCookie } from "@/utils/handleCookie";
import { formatDateOnly, parseDate } from "@/utils/dateUtils";
import { buildNotificationText } from "@/utils/notificationText";

interface Notification {
  id: string;
  message: string; // HTML-safe string từ formatter
  time: string;    // dạng "x phút trước"
  timeMs: number;  // epoch ms — để sort
  avatar?: string;
}

interface NotificationHeaderProps {
  profile: { userId: string } | null;
}

// Map DTO → UI model
const mapToNotification = (dto: NotificationDTO): Notification => {
  const createdDate = dto.createdAt ? parseDate(dto.createdAt) : new Date();
  return {
    id: String(dto.notificationId ?? `${Date.now()}`),
    message: buildNotificationText(dto),
    time: formatDateOnly(createdDate),
    timeMs: createdDate.getTime(),
    avatar: dto.actor?.avatar || unknownAvatar,
  };
};

// Chuẩn hoá dữ liệu từ WS hoặc nơi khác về Notification
const normalizeNotification = (n: any): Notification => {
  if (n && typeof n === "object" && "notificationId" in n) {
    return mapToNotification(n as NotificationDTO);
  }
  if (n && typeof n === "object" && typeof n.id === "string") {
    const timeMs =
      typeof n.timeMs === "number"
        ? n.timeMs
        : n.time
        ? parseDate(n.time).getTime()
        : Date.now();
    return {
      ...n,
      timeMs,
      time: formatDateOnly(timeMs),
    };
  }
  const now = Date.now();
  return {
    id: String(now),
    message: "Thông báo mới.",
    time: formatDateOnly(now),
    timeMs: now,
    avatar: unknownAvatar,
  };
};

const NotificationHeader: React.FC<NotificationHeaderProps> = ({ profile }) => {
  const accessToken = getCookie("accessToken");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const scrollRef = useRef<HTMLUListElement>(null);

  // Reset khi đổi user
  useEffect(() => {
    setNotifications([]);
    setPage(0);
    setHasMore(true);
    setTotalCount(0);
  }, [profile?.userId]);

  // Cấp token cho WS
  useEffect(() => {
    setWebSocketToken(accessToken ?? null);
  }, [accessToken]);

  // Load danh sách có phân trang + lấy tổng số thông báo
  useEffect(() => {
    let cancelled = false;
    const fetchPage = async () => {
      if (!profile?.userId || !hasMore) return;
      setIsLoading(true);
      try {
        const resp = await getNotifications({
          page,
          size: pageSize,
          sort: "createdAt,desc",
        });

        const dtos = Array.isArray(resp?.content) ? resp.content : [];
        setTotalCount(
          typeof resp?.totalElements === "number" ? resp.totalElements : dtos.length
        );

        const next =
          typeof resp?.last === "boolean"
            ? !resp.last
            : dtos.length === pageSize;

        const incoming = dtos.map(mapToNotification);

        if (!cancelled) {
          setHasMore(next);
          setNotifications((prev) => {
            const map = new Map<string, Notification>();
            for (const n of prev) map.set(n.id, n);
            for (const n of incoming) map.set(n.id, n);
            return Array.from(map.values()).sort((a, b) => b.timeMs - a.timeMs);
          });
        }
      } catch (err) {
        if (!cancelled) console.error("[notifications] fetch error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchPage();
    return () => {
      cancelled = true;
    };
  }, [profile?.userId, page, pageSize, hasMore]);

  // Infinite scroll
  const handleScroll = (e: UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    if (!isLoading && hasMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setPage((p) => p + 1);
    }
  };

  // WebSocket realtime
  useEffect(() => {
    const cb = (payload: any) => {
      const n = normalizeNotification(payload);
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
      setTotalCount((c) => c + 1); // tăng count khi có thông báo mới
    };
    webSocketService.registerNotificationCallback(cb);
    return () => {
      webSocketService.unregisterNotificationCallback(cb);
    };
  }, [profile?.userId]);

  // Auto-update "x phút trước" mỗi 60s
  useEffect(() => {
    const t = window.setInterval(() => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, time: formatDateOnly(n.timeMs) }))
      );
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <li className="nav-item dropdown-notifications navbar-dropdown dropdown me-3 me-xl-2">
      <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown">
        <span className="position-relative">
          <i className="icon-base bx bx-bell icon-md" />
          {totalCount > 0 && (
            <span className="badge rounded-pill bg-danger">
              {totalCount > 10 ? "10+" : totalCount}
            </span>
          )}
        </span>
      </a>

      <ul className="dropdown-menu dropdown-menu-end p-0">
        <li className="dropdown-menu-header border-bottom">
          <div className="dropdown-header d-flex align-items-center py-3">
            <h6 className="mb-0 me-auto">Notifications</h6>
            <span className="badge bg-label-primary me-2">
              {totalCount > 10 ? "10+" : totalCount} New
            </span>
          </div>
        </li>

        <li className="dropdown-notifications-list">
          <ul
            ref={scrollRef}
            onScroll={handleScroll}
            className="list-group list-group-flush"
            style={{ maxHeight: 440, overflowY: "auto" }}
          >
            {notifications.map((n) => (
              <li key={n.id} className="list-group-item dropdown-notifications-item">
                <div className="d-flex">
                  <div className="flex-shrink-0 me-3">
                    <img src={n.avatar} className="rounded-circle" width={40} height={40} alt="avatar" />
                  </div>
                  <div className="flex-grow-1">
                    <small
                      className="d-block"
                      dangerouslySetInnerHTML={{ __html: n.message }}
                    />
                    <small className="text-body-secondary">{n.time}</small>
                  </div>
                </div>
              </li>
            ))}

            {isLoading && <li className="text-center py-2">Loading more…</li>}
            {!hasMore && !isLoading && notifications.length === 0 && (
              <li className="text-center py-3">No notifications</li>
            )}
          </ul>
        </li>
      </ul>
    </li>
  );
};

export default NotificationHeader;
