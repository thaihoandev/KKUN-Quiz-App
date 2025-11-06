import "@/assets/vendor/css/pages/page-profile.css";
import HeaderProfile from "@/components/headers/HeaderProfile";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, getUserById } from "@/services/userService";
import ProfileTab from "@/components/tabs/ProfileTab";
import ViewProfileTab from "@/components/tabs/ViewProfileTab";
import ClassesTab from "@/components/tabs/ClassesTab";
import QuizzesTab from "@/components/tabs/QuizzesTab";
import CoursesTab from "@/components/tabs/CourseTab";
import NavigationMenu from "@/components/NavigationMenuProfile";
import EditProfileModal from "@/components/modals/EditProfileModal";
import EditAvatarModal from "@/components/modals/EditAvatarModal";
import { UserResponseDTO } from "@/interfaces";
import { useParams } from "react-router-dom";

const UserProfilePage = () => {
  const { userId: routeUserId } = useParams<{ userId?: string }>();

  const [currentUser, setCurrentUser] = useState<UserResponseDTO | null>(null);
  const [profile, setProfile] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);

  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    // Trang của chính mình nếu:
    // - Không có routeUserId
    // - Hoặc routeUserId === currentUser.userId
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

  // Load user hiện tại và profile được xem
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getCurrentUser();
        if (cancelled) return;
        setCurrentUser(me);

        if (!routeUserId || routeUserId === me?.userId) {
          setProfile(me);
        } else {
          const other = await getUserById(routeUserId);
          if (cancelled) return;
          setProfile(other);
        }
      } catch (e) {
        if (cancelled) return;
        setError("Không thể tải thông tin người dùng");
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [routeUserId]);

  // Mỗi lần đổi user xem → reset về tab "profile"
  useEffect(() => {
    setActiveTab("profile");
  }, [routeUserId]);

  const handleUpdateProfile = (updated: UserResponseDTO) => {
    setProfile(updated);
    if (isOwner) setCurrentUser(updated);
  };

  // ✅ Nếu là owner → truyền currentUser vào ProfileTab để luôn đúng dữ liệu
  const targetProfile = isOwner ? currentUser : profile;

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
        return isOwner ? <QuizzesTab profile={targetProfile} /> : <ViewProfileTab profile={targetProfile} />;
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

      {/* Tab Content */}
      {loading ? (
        <div>Loading...</div>
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
