import React from "react";
import FormRegister from "@/components/forms/FormRegister";
import backgroundImage from "@/assets/img/backgrounds/window_people.jpg";

const RegisterPage: React.FC = () => {
  return (
    <div className="row ">
      {/* Left Section */}
      <div className="d-none d-lg-flex col-lg-6 align-items-center justify-content-center position-relative p-0">
        <img
          src={backgroundImage}
          className="w-100 h-75 object-fit-cover"
          alt="Register illustration"
          loading="lazy"
        />
        <div className="image-overlay"></div>
      </div>

      {/* Right Section */}
      <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 bg-light">
        <FormRegister />
      </div>
    </div>
  );
};

export default RegisterPage;
