import React from "react";
import FormLogin from "@/components/forms/FormLogin";
import backgroundImage from "@/assets/img/backgrounds/window_people.jpg";

const LoginPage: React.FC = () => {
  return (
    <div className=" row m-0">
      {/* Left Section */}
      <div className="d-none d-lg-flex col-lg-7 col-xl-8 align-items-center p-2 position-relative">
        <div className="w-100 d-flex justify-content-center">
          <img
            src={backgroundImage}
            className="img"
            alt="Login illustration"
            width="100%"
            loading="lazy"
            data-app-dark-img="illustrations/boy-with-rocket-dark.png"
            data-app-light-img="illustrations/boy-with-rocket-light.png"
          />
        </div>
        <div className="image-overlay"></div>
      </div>
      {/* /Left Section */}
      <FormLogin />
    </div>
  );
};

export default LoginPage;