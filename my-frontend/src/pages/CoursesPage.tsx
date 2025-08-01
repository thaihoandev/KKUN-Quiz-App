import HeaderProfile from "@/components/headers/HeaderProfile";
import NavigationMenuProfile from "@/components/NavigationMenuProfile";
import React from "react";
import {useEffect, useState} from "react";
import {getCurrentUser} from "@/services/userService";
import {useAuth} from "@/hooks/useAuth";

const CoursesPage = () => {
    const courseMenuItems = [
        {path: "/profile", icon: "bx-user", label: "Profile"},
        {path: "/classes", icon: "bx-chalkboard", label: "Classes"},
        {path: "/courses", icon: "bx-book", label: "Courses"},
        {path: "/quizzes", icon: "bx-task", label: "Quizzes"},
    ];
    const {user} = useAuth(); // Lấy thông tin user từ Zustand
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const data = await getCurrentUser();
                console.log("data", data);
                setProfile(data);
            } catch (err: any) {
                setError("Không thể tải thông tin người dùng");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []); // Không cần phụ thuộc vào `user?.id` vì API `/me` tự lấy từ token
    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <HeaderProfile profile={profile} />
            {/* <!--/ Header --> */}

            {/* <!-- Navbar pills --> */}
            <NavigationMenuProfile menuItems={courseMenuItems} />

            <div className="row g-6">
                <div className="col-xl-4 col-lg-6 col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3 pb-1">
                                <a
                                    href="javascript:;"
                                    className="d-flex align-items-center"
                                >
                                    <div className="avatar me-2">
                                        <img
                                            src="../../assets/img/icons/brands/react-label.png"
                                            alt="Avatar"
                                            className="rounded-circle"
                                        />
                                    </div>
                                    <div className="me-2 text-heading h5 mb-0">
                                        React Developers
                                    </div>
                                </a>
                                <div className="ms-auto">
                                    <ul className="list-inline mb-0 d-flex align-items-center">
                                        <li className="list-inline-item me-0">
                                            <a
                                                href="javascript:void(0);"
                                                className="d-flex align-self-center btn btn-icon btn-text-secondary rounded-pill"
                                            >
                                                <i className="icon-base bx bx-star icon-md text-body-secondary"></i>
                                            </a>
                                        </li>
                                        <li className="list-inline-item">
                                            <div className="dropdown">
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-text-secondary rounded-pill dropdown-toggle hide-arrow p-0"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                >
                                                    <i className="icon-base bx bx-dots-vertical-rounded icon-md text-body-secondary"></i>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end">
                                                    <li>
                                                        <a
                                                            className="dropdown-item"
                                                            href="javascript:void(0);"
                                                        >
                                                            Rename Team
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="dropdown-item"
                                                            href="javascript:void(0);"
                                                        >
                                                            View Details
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="dropdown-item"
                                                            href="javascript:void(0);"
                                                        >
                                                            Add to favorites
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <hr className="dropdown-divider" />
                                                    </li>
                                                    <li>
                                                        <a
                                                            className="dropdown-item text-danger"
                                                            href="javascript:void(0);"
                                                        >
                                                            Delete Team
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <p className="mb-3 pb-1">
                                We don’t make assumptions about the rest of your
                                technology stack, so you can develop new
                                features...
                            </p>
                            <div className="d-flex align-items-center">
                                <div className="d-flex align-items-center">
                                    <ul className="list-unstyled d-flex align-items-center avatar-group mb-0">
                                        <li
                                            data-bs-toggle="tooltip"
                                            data-popup="tooltip-custom"
                                            data-bs-placement="top"
                                            title="Vinnie Mostowy"
                                            className="avatar avatar-sm pull-up"
                                        >
                                            <img
                                                className="rounded-circle"
                                                src="../../assets/img/avatars/1.png"
                                                alt="Avatar"
                                            />
                                        </li>
                                        <li
                                            data-bs-toggle="tooltip"
                                            data-popup="tooltip-custom"
                                            data-bs-placement="top"
                                            title="Allen Rieske"
                                            className="avatar avatar-sm pull-up"
                                        >
                                            <img
                                                className="rounded-circle"
                                                src="../../assets/img/avatars/5.png"
                                                alt="Avatar"
                                            />
                                        </li>
                                        <li
                                            data-bs-toggle="tooltip"
                                            data-popup="tooltip-custom"
                                            data-bs-placement="top"
                                            title="Julee Rossignol"
                                            className="avatar avatar-sm pull-up"
                                        >
                                            <img
                                                className="rounded-circle"
                                                src="../../assets/img/avatars/12.png"
                                                alt="Avatar"
                                            />
                                        </li>
                                        <li className="avatar avatar-sm">
                                            <span
                                                className="avatar-initial rounded-circle pull-up"
                                                data-bs-toggle="tooltip"
                                                data-bs-placement="top"
                                                title="9 more"
                                            >
                                                +9
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="ms-auto">
                                    <a href="javascript:;" className="me-1">
                                        <span className="badge bg-label-primary">
                                            React
                                        </span>
                                    </a>
                                    <a href="javascript:;">
                                        <span className="badge bg-label-info">
                                            MUI
                                        </span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursesPage;
