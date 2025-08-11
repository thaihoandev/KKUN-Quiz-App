import "@/assets/vendor/css/pages/page-profile.css";
import HeaderProfile from "@/components/headers/HeaderProfile";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/userService";
import ProfileTab from "@/components/tabs/ProfileTab";
import ClassesTab from "@/components/tabs/ClassesTab";
import QuizzesTab from "@/components/tabs/QuizzesTab";
import EditProfileModal from "@/components/modals/EditProfileModal";
import { UserResponseDTO } from "@/interfaces";
import CoursesTab from "@/components/tabs/CourseTab";
import NavigationMenu from "@/components/NavigationMenuProfile";
import EditAvatarModal from "@/components/modals/EditAvatarModal";

const UserDashboardPage = () => {
  const profileMenuItems = [
    { path: "profile", icon: "bx-user", label: "Profile" },
    { path: "classes", icon: "bx-chalkboard", label: "Classes" },
    { path: "courses", icon: "bx-book", label: "Courses" },
    { path: "quizzes", icon: "bx-task", label: "Quizzes" },
  ];

  const [profile, setProfile] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);

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
  }, []);

  const handleUpdateProfile = (updatedProfile: UserResponseDTO) => {
    setProfile(updatedProfile);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab profile={profile} onEditProfile={() => setShowProfileModal(true)} />;
      case "classes":
        return <ClassesTab />;
      case "courses":
        return <CoursesTab />;
      case "quizzes":
        return <QuizzesTab profile={profile} />;
      default:
        return <ProfileTab profile={profile} onEditProfile={() => setShowProfileModal(true)} />;
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* <!-- Header --> */}
      <HeaderProfile profile={profile} onEditAvatar={() => setShowAvatarModal(true)} />
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

      {showProfileModal && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
      {showAvatarModal && profile && (
        <EditAvatarModal
          profile={profile}
          onClose={() => setShowAvatarModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default UserDashboardPage;