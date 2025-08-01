import NavigationMenuProfile from "@/components/NavigationMenuProfile";
import "@/assets/vendor/css/pages/page-profile.css";
import HeaderProfile from "@/components/headers/HeaderProfile";

import {useEffect, useState} from "react";
import {getCurrentUser} from "@/services/userService";
import {formatDateOnly, formatDateTime} from "@/utils/dateUtils";
import QuizCard from "@/components/cards/QuizCard";

const ProfilePage = () => {
    const profileMenuItems = [
        {path: "/profile", icon: "bx-user", label: "Profile"},
        {path: "/classes", icon: "bx-chalkboard", label: "Classes"},
        {path: "/courses", icon: "bx-book", label: "Courses"},
        {path: "/quizzes", icon: "bx-task", label: "Quizzes"},
    ];

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const data = await getCurrentUser();
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
            {/* <!-- Header --> */}
            <HeaderProfile profile={profile} />
            {/* <!--/ Header --> */}

            {/* <!-- Navbar pills --> */}
            <NavigationMenuProfile menuItems={profileMenuItems} />
            {/* <!--/ Navbar pills --> */}

            {/* <!-- User Profile Content --> */}
            <div className="row">
                <div className="col-xl-4 col-lg-5 col-md-5">
                    {/* <!-- About User --> */}
                    <div className="card mb-6">
                        <div className="card-body">
                            <small className="card-text text-uppercase text-body-secondary small">
                                About
                            </small>
                            <ul className="list-unstyled my-3 py-1">
                                <li className="d-flex align-items-center mb-4">
                                    <i className="icon-base bx bx-user"></i>
                                    <span className="fw-medium mx-2">
                                        Full Name:
                                    </span>{" "}
                                    <span>{profile?.name}</span>
                                </li>
                                <li className="d-flex align-items-center mb-4">
                                    <i className="icon-base bx bx-crown"></i>
                                    <span className="fw-medium mx-2">
                                        Role:
                                    </span>{" "}
                                    <span>{profile?.role}</span>
                                </li>
                                <li className="d-flex align-items-center mb-4">
                                    <i className="icon-base bx bx-flag"></i>
                                    <span className="fw-medium mx-2">
                                        Email:
                                    </span>{" "}
                                    <span>{profile?.email}</span>
                                </li>
                                <li className="d-flex align-items-center mb-4">
                                    <i className="icon-base bx bx-detail"></i>
                                    <span className="fw-medium mx-2">
                                        Created at:
                                    </span>{" "}
                                    <span>
                                        {formatDateOnly(profile?.createdAt)}
                                    </span>
                                </li>
                                <li className="d-flex align-items-center">
                                    <i className="icon-base bx bx-check"></i>
                                    <span className="fw-medium mx-2">
                                        Status:
                                    </span>{" "}
                                    <span
                                        className={
                                            profile?.active
                                                ? "text-success fw-bold"
                                                : "text-danger fw-bold"
                                        }
                                    >
                                        {profile?.active
                                            ? "ACTIVE"
                                            : "INACTIVE"}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    {/* <!--/ About User --> */}
                    {/* <!-- Profile Overview --> */}
                    <div className="card mb-6">
                        <div className="card-body">
                            <small className="card-text text-uppercase text-body-secondary small">
                                Overview
                            </small>
                            <div className="row p-3">
                                <div>Comming soon!</div>
                            </div>
                        </div>
                    </div>
                    {/* <!--/ Profile Overview --> */}
                </div>
                <div className="col-xl-8 col-lg-7 col-md-7">
                    <QuizCard />
                </div>
            </div>
            {/* <!--/ User Profile Content --> */}
        </div>
    );
};

export default ProfilePage;
