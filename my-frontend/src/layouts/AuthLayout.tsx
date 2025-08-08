import React from "react";
import { Link, Outlet } from "react-router-dom";
import "@/assets/vendor/css/pages/page-auth.css";

const AuthLayout: React.FC = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="app-brand auth-cover-brand d-flex align-items-center gap-2 mb-4">
          <span className="app-brand-text demo text-heading fw-bold fs-3 text-primary">
            KKUN QUIZ
          </span>
        </Link>
        {/* /Logo */}
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;