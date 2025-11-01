import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { getCurrentUser } from "@/services/userService";
import { useNavigate } from "react-router-dom";
import HeaderMain from "@/components/headers/HeaderMain";

const SingleLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await getCurrentUser();
        setProfile(data);
      } catch {
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // ✅ Tự động đo chiều cao header
  useEffect(() => {
    if (headerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        setHeaderHeight(headerRef.current?.offsetHeight || 0);
      });
      resizeObserver.observe(headerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <>
      <header ref={headerRef} className="fixed-top bg-light shadow-sm">
        <HeaderMain profile={profile} />
      </header>

      <main id="app-main" style={{ paddingTop: `${headerHeight}px` }}>
        <div className="h-100">
          <Outlet />
        </div>
      </main>
    </>
  );
};

export default SingleLayout;
