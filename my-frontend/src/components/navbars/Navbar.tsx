import UserDropdown from "../dropdowns/UserDropdown";
import NotificationHeader from "../NotificationHeader";
import SearchBar from "../SearchBar";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  profile: { userId: string; name?: string; avatar?: string } | null;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const navigate = useNavigate();
  return (
    <nav className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme">
      <div
        className="navbar-nav-right d-flex align-items-center w-100"
        id="navbar-collapse"
      >
        {/* 🔎 Search Bar - Căn trái */}
        <div className="search-container me-auto w-50">
          <SearchBar />
        </div>

        {/* 🔔 Notifications & 👤 User - Căn phải */}
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          {profile ? (
            <>
              <NotificationHeader profile={profile} />
              <UserDropdown profile={profile} />
            </>
          ) : (
            <div className="flex">
              <button
                onClick={() => navigate("/login")}
                className="btn btn-outline-primary"
              >
                Login
              </button>
            </div>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;