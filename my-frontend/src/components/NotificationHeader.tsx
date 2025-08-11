import React, { useEffect, useState, useRef, UIEvent } from "react";
import { webSocketService, setWebSocketUserId } from "@/services/webSocketService";
import { getNotifications, NotificationDTO, PaginatedResponse } from "@/services/notificationService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";

interface Notification {
  id: string;            // dùng string ID ổn định từ BE
  message: string;
  time: string;
  timeMs: number;        // để sort
  avatar?: string;
}

interface NotificationHeaderProps {
  profile: { userId: string } | null;
}

// Map DTO → UI model (ổn định theo id từ BE)
const mapToNotification = (dto: NotificationDTO): Notification => {
  const date = new Date(dto.createdAt);
  return {
    id: dto.notificationId, // dùng id gốc từ BE
    message:
      `<strong>${dto.actor?.name || "Someone"}</strong> ${dto.verb} your ${dto.targetType}` +
      (dto.content ? `: "<strong>${dto.content}</strong>"` : "") + ".",
    time: date.toLocaleTimeString(),
    timeMs: date.getTime(),
    avatar: dto.actor?.avatar || unknownAvatar,
  };
};

// Chuẩn hoá dữ liệu từ WS hoặc nơi khác về Notification
const normalizeNotification = (n: any): Notification => {
  // Nếu là DTO từ BE (có notificationId)
  if (n && typeof n === "object" && "notificationId" in n) {
    return mapToNotification(n as NotificationDTO);
  }
  // Nếu đã là Notification (có id string/timeMs)
  if (n && typeof n === "object" && typeof n.id === "string") {
    const timeMs =
      typeof n.timeMs === "number"
        ? n.timeMs
        : n.time
        ? new Date(n.time).getTime()
        : Date.now();
    return { ...n, timeMs };
  }
  // Fallback an toàn
  const now = Date.now();
  return {
    id: String(now),
    message: "New notification.",
    time: new Date(now).toLocaleTimeString(),
    timeMs: now,
    avatar: unknownAvatar,
  };
};

const NotificationHeader: React.FC<NotificationHeaderProps> = ({ profile }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLUListElement>(null);

  // Khi đổi user → reset danh sách & phân trang
  useEffect(() => {
    setNotifications([]);
    setPage(0);
    setHasMore(true);
  }, [profile?.userId]);

  // Lấy trang dữ liệu (phân trang)
  useEffect(() => {
    if (!profile?.userId || !hasMore) return;

    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const resp: PaginatedResponse<NotificationDTO> = await getNotifications({
          page,
          size: pageSize,
          sort: "createdAt,desc",
        });
        const dtos = resp.content || [];

        if (dtos.length < pageSize) setHasMore(false);

        const incoming = dtos.map(mapToNotification);

        // Khử trùng bằng Map (ưu tiên dữ liệu mới ghi đè dữ liệu cũ theo id)
        setNotifications((prev) => {
          const map = new Map<string, Notification>();
          for (const n of prev) map.set(n.id, n);
          for (const n of incoming) map.set(n.id, n);
          // Sắp xếp mới nhất lên trên
          return Array.from(map.values()).sort((a, b) => b.timeMs - a.timeMs);
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [profile?.userId, page, pageSize, hasMore]);

  // Infinite scroll
  const handleScroll = (e: UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    if (!isLoading && hasMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setPage((p) => p + 1);
    }
  };

  // WebSocket realtime: chèn notification mới lên đầu, khử trùng theo id
  useEffect(() => {
    setWebSocketUserId(profile?.userId ?? null);

    const cb = (payload: any) => {
      const n = normalizeNotification(payload);
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
    };

    webSocketService.registerNotificationCallback(cb);
    return () => {
      webSocketService.unregisterNotificationCallback(cb);
    };
  }, [profile?.userId]);

  return (
    <li className="nav-item dropdown-notifications navbar-dropdown dropdown me-3 me-xl-2">
      <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown">
        <span className="position-relative">
          <i className="icon-base bx bx-bell icon-md" />
          {notifications.length > 0 && (
            <span className="badge rounded-pill bg-danger">{notifications.length}</span>
          )}
        </span>
      </a>

      <ul className="dropdown-menu dropdown-menu-end p-0">
        <li className="dropdown-menu-header border-bottom">
          <div className="dropdown-header d-flex align-items-center py-3">
            <h6 className="mb-0 me-auto">Notifications</h6>
            <span className="badge bg-label-primary me-2">
              {notifications.length} New
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
                    <img src={n.avatar} className="rounded-circle" width={40} alt="avatar" />
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
