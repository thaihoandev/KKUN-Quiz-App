import "@/assets/vendor/css/pages/page-profile.css";
import HeaderProfile from "@/components/headers/HeaderProfile";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import ProfileTab from "@/components/tabs/ProfileTab";
import ClassesTab from "@/components/tabs/ClassesTab";
import QuizzesTab from "@/components/tabs/QuizzesTab";
import EditProfileModal from "@/components/modals/EditProfileModal";
import CoursesTab from "@/components/tabs/CourseTab";
import NavigationMenu from "@/components/NavigationMenuProfile";
import EditAvatarModal from "@/components/modals/EditAvatarModal";
import { User } from "@/types/users";

const UserDashboardPage = () => {
  const profileMenuItems = [
    { path: "profile", icon: "bx-user", label: "Profile" },
    { path: "classes", icon: "bx-chalkboard", label: "Classes" },
    { path: "courses", icon: "bx-book", label: "Courses" },
    { path: "quizzes", icon: "bx-task", label: "Quizzes" },
  ];

  const ensureMe = useAuthStore((s) => s.ensureMe);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const userFromStore = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // ✅ Lấy user từ store hoặc API (qua ensureMe)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await ensureMe();
        if (me) setProfile(me);
        else setError("Không thể tải thông tin người dùng");
      } catch (err) {
        console.error("Lỗi tải user:", err);
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [ensureMe]);

  const handleUpdateProfile = (updatedProfile: User) => {
    setProfile(updatedProfile);
    refreshMe(); // đồng bộ lại store
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileTab
            profile={profile}
            onEditProfile={() => setShowProfileModal(true)}
          />
        );
      case "classes":
        return <ClassesTab />;
      case "courses":
        return <CoursesTab />;
      case "quizzes":
        return <QuizzesTab profile={profile} />;
      default:
        return (
          <ProfileTab
            profile={profile}
            onEditProfile={() => setShowProfileModal(true)}
          />
        );
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <HeaderProfile
        profile={profile ?? userFromStore}
        onEditAvatar={() => setShowAvatarModal(true)}
      />

      {/* Navbar pills */}
      <NavigationMenu
        menuItems={profileMenuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Nội dung tab */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        renderTabContent()
      )}

      {/* Modals */}
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
