import { Outlet } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/userService";
import { useNavigate } from "react-router-dom";
import HeaderMain from "@/components/headers/HeaderMain";

const SingleLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  return (
    <>
      <header className="fixed-top bg-light shadow-sm">
        <HeaderMain profile={profile} />
      </header>

      {/* Phần còn lại của màn hình, không cho trang scroll */}
      <main
              id="app-main"
      >
        <div className="h-100">            {/* h-100 để cột cao đầy */}
          <div className="h-100" style={{ paddingTop: "50px" }}>
            <Outlet />
          </div>
        </div>
      </main>
    </>
  );
};

export default SingleLayout;
