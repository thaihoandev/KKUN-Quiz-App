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
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Load user từ store hoặc API
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
    refreshMe();
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
    <div
      className="container-xxl flex-grow-1 container-p-y"
      style={{
        background: "var(--background-color)",
        transition: "background 0.4s ease, color 0.25s ease",
      }}
    >
      {/* Header */}
      <HeaderProfile
        profile={profile ?? userFromStore}
        onEditAvatar={() => setShowAvatarModal(true)}
      />

      {/* Navigation Menu */}
      <NavigationMenu
        menuItems={profileMenuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {loading ? (
        <div
          className="text-center py-5"
          style={{
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <div
            className="spinner-border"
            role="status"
            style={{
              borderColor: "var(--border-color)",
              borderRightColor: "var(--primary-color)",
              width: "2.5rem",
              height: "2.5rem",
            }}
          >
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.95rem",
              margin: 0,
            }}
          >
            Đang tải thông tin người dùng...
          </p>
        </div>
      ) : error ? (
        <div
          className="alert"
          style={{
            background: "var(--surface-color)",
            borderLeft: "4px solid var(--danger-color)",
            color: "var(--danger-color)",
            padding: "1.25rem",
            borderRadius: "14px",
            marginBottom: "2rem",
            animation: "slideInUp 0.3s ease forwards",
          }}
        >
          <i
            className="bx bx-error-circle"
            style={{
              marginRight: "0.5rem",
              fontSize: "1.1rem",
            }}
          />
          {error}
        </div>
      ) : (
        <div
          style={{
            animation: "slideInUp 0.5s ease forwards",
          }}
        >
          {renderTabContent()}
        </div>
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

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default UserDashboardPage;