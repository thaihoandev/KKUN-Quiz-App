import React, {useEffect, useState} from "react";

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    avatar?: string;
}

const NotificationHeader = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // fetchNotifications();
    }, []);

    // Gọi API để lấy danh sách thông báo từ backend
    // const fetchNotifications = async () => {
    //     try {
    //         const response = await fetch("https://your-api.com/notifications"); // Thay URL API thực tế
    //         if (!response.ok) {
    //             throw new Error("Failed to fetch notifications");
    //         }
    //         const data = await response.json();
    //         setNotifications(data);
    //     } catch (error) {
    //         console.error("Error fetching notifications:", error);
    //     }
    // };

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
                    <ul className="list-group list-group-flush">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className="list-group-item list-group-item-action dropdown-notifications-item"
                                >
                                    <div className="d-flex">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar">
                                                <img
                                                    src={
                                                        notification.avatar ||
                                                        "/default-avatar.png"
                                                    }
                                                    className="rounded-circle"
                                                    alt="User avatar"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="small mb-0">
                                                {notification.title}
                                            </h6>
                                            <small className="mb-1 d-block text-body">
                                                {notification.message}
                                            </small>
                                            <small className="text-body-secondary">
                                                {notification.time}
                                            </small>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="text-center py-3">
                                No new notifications
                            </li>
                        )}
                    </ul>
                </li>

                <li className="border-top">
                    <div className="d-grid p-3">
                        <a
                            className="btn btn-primary btn-sm d-flex justify-content-center"
                            href="#"
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
