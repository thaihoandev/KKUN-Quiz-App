import React, { useEffect, useState } from "react";
import { webSocketService, setWebSocketUserId } from "@/services/webSocketService";
import { getNotifications, NotificationDTO, PaginatedResponse } from "@/services/notificationService";
import { getPostById, PostDTO } from "@/services/postService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  avatar?: string;
}

interface NotificationHeaderProps {
  profile: { userId: string; name?: string; avatar?: string } | null;
}

const NotificationHeader: React.FC<NotificationHeaderProps> = ({ profile }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10); // Matches backend response
  const [totalPages, setTotalPages] = useState(1);
  const [sort] = useState("createdAt,desc"); // Matches backend default
  const [isLoading, setIsLoading] = useState(false);

  // Capitalize first letter of a string
  const capitalizeFirstLetter = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1);

  // Map NotificationDTO to Notification with post fetch if applicable
  const mapToNotification = async (notification: NotificationDTO): Promise<Notification> => {
    let postContentExcerpt = '';
    if (notification.targetType === 'post') {
      try {
        const post: PostDTO = await getPostById(notification.targetId);
        const content = post.content.trim();
        postContentExcerpt = content.length > 50
          ? `${capitalizeFirstLetter(content.slice(0, 50))}...`
          : capitalizeFirstLetter(content);
      } catch (error) {
        postContentExcerpt = 'Post content unavailable';
      }
      }
    console.log('Fetched notifications:', notification);
    
    const actorName = notification.actor?.name || 'Someone';
    const title = `<strong>${actorName}</strong> ${notification.verb} your ${notification.targetType}`;
    const message = `<strong>${actorName}</strong> ${notification.verb} your ${notification.targetType}${postContentExcerpt ? `: "<strong>${postContentExcerpt}</strong>"` : ''}.`;

    return {
      id: parseInt(notification.notificationId.split('-')[1], 10) || Date.now(),
      title,
      message,
      time: new Date(notification.createdAt).toLocaleTimeString(),
      avatar: notification.actor?.avatar || unknownAvatar,
    };
  };

  // Fetch notifications with pagination
  useEffect(() => {
    if (profile?.userId) {
      const fetchNotifications = async () => {
        setIsLoading(true);
        try {
          const response: PaginatedResponse<NotificationDTO> = await getNotifications({
            page: currentPage,
            size: pageSize,
            sort,
          });
            const fetchedNotifications = response.content || [];
            const mappedNotifications = await Promise.all(fetchedNotifications.map(mapToNotification));
          setNotifications(mappedNotifications);
          setTotalPages(response.totalPages || 1);
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          setNotifications([]);
          setTotalPages(1);
        } finally {
          setIsLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [profile?.userId, currentPage, pageSize, sort]);

  // Handle real-time WebSocket notifications
  useEffect(() => {
    console.log('Setting WebSocket userId:', profile?.userId);
    setWebSocketUserId(profile?.userId ?? null);

    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => {
        const newNotifications = [notification, ...prev.filter(n => n.id !== notification.id)].slice(0, pageSize);
        console.log('Updated notifications:', newNotifications);
        return newNotifications;
      });
    };

    webSocketService.registerNotificationCallback(handleNotification);

    return () => {
      webSocketService.unregisterNotificationCallback(handleNotification);
    };
  }, [profile?.userId, pageSize]);

  // Handle page navigation
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <li className="nav-item dropdown-notifications navbar-dropdown dropdown me-3 me-xl-2">
      <a
        className="nav-link dropdown-toggle hide-arrow"
        href="#"
        data-bs-toggle="dropdown"
      >
        <span className="position-relative">
          <i className="icon-base bx bx-bell icon-md"></i>
          {notifications.length > 0 && (
            <span className="badge rounded-pill bg-danger">
              {notifications.length}
            </span>
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

        <li className="dropdown-notifications-list scrollable-container">
          <ul 
            className="list-group list-group-flush" 
            style={{ maxHeight: '300px', overflowY: 'auto' }}
          >
            {isLoading ? (
              <li className="text-center py-3">Loading...</li>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="list-group-item list-group-item-action dropdown-notifications-item"
                >
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar">
                        <img
                          src={notification.avatar || "/default-avatar.png"}
                          className="rounded-circle"
                          alt="User avatar"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <small className="mb-1 d-block text-body" dangerouslySetInnerHTML={{ __html: notification.message }}></small>
                      <small className="text-body-secondary">
                        {notification.time}
                      </small>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center py-3">No new notifications</li>
            )}
          </ul>
        </li>

        <li className="border-top">
          <div className="d-flex justify-content-between align-items-center p-3">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 0 || isLoading}
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-body-secondary">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1 || isLoading}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </li>

        <li className="border-top">
          <div className="d-grid p-3">
            <a
              className="btn btn-primary btn-sm d-flex justify-content-center"
              href="#"
              aria-label="View all notifications"
            >
              <small>View all notifications</small>
            </a>
          </div>
        </li>
      </ul>
    </li>
  );
};

export default NotificationHeader;