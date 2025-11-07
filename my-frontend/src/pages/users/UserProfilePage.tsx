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

// ✅ Kiểu gộp giúp linh hoạt giữa dữ liệu từ store (User) và từ API (UserResponseDTO)

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

  // ✅ Xác định có phải đang xem trang của chính mình
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    return !routeUserId || routeUserId === currentUser.userId;
  }, [routeUserId, currentUser]);

  // ✅ Menu động theo quyền
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

  // ✅ Load thông tin user hiện tại và profile đang xem
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await ensureMe();
        if (cancelled) return;
        setCurrentUser(me);

        // Nếu đang xem trang cá nhân
        if (!routeUserId || routeUserId === me?.userId) {
          setProfile(me);
        } else {
          // Nếu đang xem trang người khác
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

  // ✅ Reset tab khi đổi user
  useEffect(() => {
    setActiveTab("profile");
  }, [routeUserId]);

  const handleUpdateProfile = (updated: User) => {
    setProfile(updated);
    if (isOwner) {
      setCurrentUser(updated);
      refreshMe(); // đồng bộ lại store
    }
  };

  // ✅ Nếu là owner → dùng currentUser để luôn khớp với store
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
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <HeaderProfile
        profile={targetProfile}
        onEditAvatar={isOwner ? () => setShowAvatarModal(true) : () => {}}
      />

      {/* Navbar pills */}
      <NavigationMenu
        menuItems={menuItems}
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

      {/* Modals chỉ dành cho chủ sở hữu */}
      {isOwner && showProfileModal && targetProfile && (
        <EditProfileModal
          profile={targetProfile}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}

      {isOwner && showAvatarModal && targetProfile && (
        <EditAvatarModal
          profile={targetProfile}
          onClose={() => setShowAvatarModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
