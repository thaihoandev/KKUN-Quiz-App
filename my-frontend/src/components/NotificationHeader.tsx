import React, { useEffect, useState, useRef, UIEvent } from "react";
import { webSocketService, setWebSocketUserId } from "@/services/webSocketService";
import { getNotifications, NotificationDTO, PaginatedResponse } from "@/services/notificationService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";

interface Notification {
  id: number;
  message: string;
  time: string;
  avatar?: string;
}

interface NotificationHeaderProps {
  profile: { userId: string } | null;
}

const NotificationHeader: React.FC<NotificationHeaderProps> = ({ profile }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLUListElement>(null);

  // Map DTO → UI model
  const mapToNotification = (dto: NotificationDTO): Notification => {
    const id = parseInt(dto.notificationId.split("-")[1], 10) || Date.now();
    const date = new Date(dto.createdAt);
    return {
      id,
      message: `<strong>${dto.actor?.name || "Someone"}</strong> ${dto.verb} your ${dto.targetType}`
             + (dto.content ? `: "<strong>${dto.content}</strong>"` : "") + ".",
      time: date.toLocaleTimeString(),
      avatar: dto.actor?.avatar || unknownAvatar,
    };
  };

  // lần đầu & khi page thay đổi: fetch thêm
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
        // nếu content ít hơn pageSize → hết
        if (dtos.length < pageSize) setHasMore(false);

        // Map và ghép vào cuối (vì API trả giảm dần sẵn)
        setNotifications(prev => [
          ...prev,
          ...dtos.map(mapToNotification)
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [profile?.userId, page]);

  // infinite scroll handler
  const handleScroll = (e: UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    if (
      !isLoading &&
      hasMore &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 20
    ) {
      setPage(p => p + 1);
    }
  };

  // Websocket realtime: chèn notification mới lên đầu
  useEffect(() => {
    setWebSocketUserId(profile?.userId ?? null);
    const cb = (n: Notification) => {
      setNotifications(prev => {
        // bỏ trùng và always new on top
        const filtered = prev.filter(x => x.id !== n.id);
        return [n, ...filtered];
      });
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
            {notifications.map(n => (
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
            {isLoading && (
              <li className="text-center py-2">Loading more…</li>
            )}
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
