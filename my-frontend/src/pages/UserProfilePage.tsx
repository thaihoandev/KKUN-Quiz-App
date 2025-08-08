import "@/assets/vendor/css/pages/page-profile.css";
import HeaderProfile from "@/components/headers/HeaderProfile";
import { useEffect, useState } from "react";
import { getUserById } from "@/services/userService"; // Assume this function is added to userService.ts
import ViewProfileTab from "@/components/tabs/ViewProfileTab"; // The new view-only tab
import ClassesTab from "@/components/tabs/ClassesTab";
import QuizzesTab from "@/components/tabs/QuizzesTab";
import CoursesTab from "@/components/tabs/CourseTab";
import NavigationMenu from "@/components/NavigationMenuProfile";
import { UserResponseDTO } from "@/interfaces";
import { useParams } from "react-router-dom";

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();

  const profileMenuItems = [
    { path: "profile", icon: "bx-user", label: "Profile" },
    { path: "classes", icon: "bx-chalkboard", label: "Classes" },
    { path: "courses", icon: "bx-book", label: "Courses" },
  ];

  const [profile, setProfile] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }
      try {
        const data = await getUserById(userId);
        setProfile(data);
      } catch (err: any) {
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ViewProfileTab profile={profile} />;
      case "classes":
        return <ClassesTab />; // Pass userId if needed for fetching data
      case "courses":
        return <CoursesTab  />; // Pass userId if needed
      case "quizzes":
        return <QuizzesTab profile={profile} />;
      default:
        return <ViewProfileTab profile={profile} />;
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* <!-- Header --> */}
          <HeaderProfile profile={profile} onEditAvatar={() => { }}/> {/* No edit option */}
      {/* <!--/ Header --> */}

      {/* <!-- Navbar pills --> */}
      <NavigationMenu
        menuItems={profileMenuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {/* <!--/ Navbar pills --> */}

      {/* <!-- Tab Content --> */}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        renderTabContent()
      )}
      {/* <!--/ Tab Content --> */}
    </div>
  );
};

export default UserProfilePage;