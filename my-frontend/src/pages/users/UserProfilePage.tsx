import "@/assets/vendor/css/pages/page-profile.css";
import HeaderProfile from "@/components/headers/HeaderProfile";
import { useEffect, useMemo, useState } from "react";
import { getUserById } from "@/services/userService";
import ProfileTab from "@/components/tabs/ProfileTab";
import ViewProfileTab from "@/components/tabs/ViewProfileTab";
import ClassesTab from "@/components/tabs/ClassesTab";
import QuizzesTab from "@/components/tabs/QuizzesTab";
import CoursesTab from "@/components/tabs/CourseTab";
import NavigationMenu from "@/components/NavigationMenuProfile";
import EditProfileModal from "@/components/modals/EditProfileModal";
import EditAvatarModal from "@/components/modals/EditAvatarModal";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types/users";

const UserProfilePage = () => {
  const { userId: routeUserId } = useParams<{ userId?: string }>();

  const ensureMe = useAuthStore((s) => s.ensureMe);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const storeUser = useAuthStore((s) => s.user);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Xác định có phải đang xem trang của chính mình
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    return !routeUserId || routeUserId === currentUser.userId;
  }, [routeUserId, currentUser]);

  // Menu động theo quyền
  const menuItems = useMemo(
    () =>
      isOwner
        ? [
            { path: "profile", icon: "bx-user", label: "Profile" },
            { path: "classes", icon: "bx-chalkboard", label: "Classes" },
            { path: "courses", icon: "bx-book", label: "Courses" },
            { path: "quizzes", icon: "bx-task", label: "Quizzes" },
          ]
        : [
            { path: "profile", icon: "bx-user", label: "Profile" },
            { path: "classes", icon: "bx-chalkboard", label: "Classes" },
            { path: "courses", icon: "bx-book", label: "Courses" },
          ],
    [isOwner]
  );

  // Load user hiện tại và profile đang xem
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await ensureMe();
        if (cancelled) return;
        setCurrentUser(me);

        if (!routeUserId || routeUserId === me?.userId) {
          setProfile(me);
        } else {
          const other = await getUserById(routeUserId);
          if (!cancelled) setProfile(other);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Không thể tải thông tin người dùng");
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [routeUserId, ensureMe]);

  // Reset tab khi đổi user
  useEffect(() => {
    setActiveTab("profile");
  }, [routeUserId]);

  const handleUpdateProfile = (updated: User) => {
    setProfile(updated);
    if (isOwner) {
      setCurrentUser(updated);
      refreshMe();
    }
  };

  const targetProfile = isOwner ? currentUser || storeUser : profile;

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileTab
            profile={targetProfile}
            currentUser={currentUser}
            isOwner={isOwner}
            onEditProfile={() => setShowProfileModal(true)}
          />
        );
      case "classes":
        return <ClassesTab />;
      case "courses":
        return <CoursesTab />;
      case "quizzes":
        return isOwner ? (
          <QuizzesTab profile={targetProfile} />
        ) : (
          <ViewProfileTab profile={targetProfile} />
        );
      default:
        return (
          <ProfileTab
            profile={targetProfile}
            currentUser={currentUser}
            isOwner={isOwner}
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
        profile={targetProfile}
        onEditAvatar={isOwner ? () => setShowAvatarModal(true) : () => {}}
      />

      {/* Navigation Menu */}
      <NavigationMenu
        menuItems={menuItems}
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
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <i
            className="bx bx-error-circle"
            style={{
              fontSize: "1.25rem",
              flexShrink: 0,
            }}
          />
          <span>{error}</span>
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

      {/* Edit Profile Modal */}
      {isOwner && showProfileModal && targetProfile && (
        <EditProfileModal
          profile={targetProfile}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}

      {/* Edit Avatar Modal */}
      {isOwner && showAvatarModal && targetProfile && (
        <EditAvatarModal
          profile={targetProfile}
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

export default UserProfilePage;