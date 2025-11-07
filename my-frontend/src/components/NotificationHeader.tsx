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

// Cho phép chỉnh nhanh min-width của dropdown
const DROPDOWN_MIN_WIDTH = 360; // px

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLUListElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      setTotalCount((c) => c + 1);
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

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <div
      ref={dropdownRef}
      className="dropdown"
      style={{ display: "inline-block", position: "relative" }}
    >
      {/* Notification Button */}
      <button
        className="dropdown-btn"
        onClick={toggleDropdown}
        style={{
          width: "40px",
          height: "40px",
          padding: "0",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <i className="bx bx-bell" style={{ fontSize: "1.25rem" }}></i>
        {totalCount > 0 && (
          <span
            className="badge bg-danger"
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              borderRadius: "50%",
              fontSize: "0.65rem",
              minWidth: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px",
            }}
          >
            {totalCount > 10 ? "10+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <div
        className={`dropdown-content ${isDropdownOpen ? "show" : ""}`}
        style={{
          minWidth: DROPDOWN_MIN_WIDTH,
          right: 0,
          left: "auto",
        }}
      >
        {/* Header */}
        <div
          className="dropdown-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
          }}
        >
          <h6 style={{ margin: 0, fontWeight: 600 }}>Thông báo</h6>
          <span
            className="badge bg-label-primary"
            style={{
              backgroundColor: "rgba(96, 165, 250, 0.2)",
              color: "var(--primary-color)",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.35rem 0.65rem",
              borderRadius: "50px",
            }}
          >
            {totalCount > 10 ? "10+" : totalCount} Mới
          </span>
        </div>

        {/* Notifications List */}
        <ul
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            maxHeight: 440,
            overflowY: "auto",
            listStyle: "none",
            margin: 0,
            padding: 0,
            borderTop: "1px solid var(--border-color)",
          }}
        >
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <li
                key={n.id}
                className="dropdown-item"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "1rem",
                  borderBottom: "1px solid var(--border-color)",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--gradient-primary)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-color)";
                }}
              >
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={n.avatar}
                    className="rounded-circle"
                    width={40}
                    height={40}
                    alt="avatar"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Content */}
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <small
                    style={{
                      display: "block",
                      marginBottom: "0.35rem",
                      wordBreak: "break-word",
                    }}
                    dangerouslySetInnerHTML={{ __html: n.message }}
                  />
                  <small
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      opacity: 0.7,
                    }}
                  >
                    {n.time}
                  </small>
                </div>
              </li>
            ))
          ) : null}

          {/* Loading State */}
          {isLoading && (
            <li
              style={{
                textAlign: "center",
                padding: "1rem",
                color: "var(--text-muted)",
              }}
            >
              <small>Đang tải thêm…</small>
            </li>
          )}

          {/* Empty State */}
          {!hasMore && !isLoading && notifications.length === 0 && (
            <li
              style={{
                textAlign: "center",
                padding: "1.5rem",
                color: "var(--text-muted)",
              }}
            >
              <small>Không có thông báo</small>
            </li>
          )}

          {/* End of List */}
          {!hasMore && notifications.length > 0 && !isLoading && (
            <li
              style={{
                textAlign: "center",
                padding: "0.75rem",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              <small>Đã hiển thị tất cả thông báo</small>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default NotificationHeader;