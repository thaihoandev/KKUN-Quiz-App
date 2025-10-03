import React from "react";
import FormLogin from "@/components/forms/FormLogin";
import backgroundImage from "@/assets/img/backgrounds/window_people.jpg";

const LoginPage: React.FC = () => {
  return (
    <div className="row">
      {/* Left Section */}
      <div className="d-none d-lg-flex col-lg-6 align-items-center justify-content-center position-relative p-0">
        <img
          src={backgroundImage}
          className="w-100 h-75 object-fit-cover"
          alt="Login illustration"
          loading="lazy"
        />
        <div className="image-overlay"></div>
      </div>

      {/* Right Section */}
      <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 bg-light">
        <div className="w-100" style={{ maxWidth: "420px" }}>
          <FormLogin />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
