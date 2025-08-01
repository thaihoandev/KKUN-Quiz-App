import FormRegister from "@/components/forms/FormRegister";
import React from "react";

import backgroundImage from "@/assets/img/illustrations/girl-with-laptop-light.png";
const RegisterPage = () => {
    return (
        <>
            <div className="authentication-inner row m-0">
                {/* <!-- /Left Text --> */}
                <div className="d-none d-lg-flex col-lg-7 col-xl-8 align-items-center p-5">
                    <div className="w-100 d-flex justify-content-center">
                        <img
                            src={backgroundImage}
                            className="img-fluid scaleX-n1-rtl"
                            alt="Login image"
                            width="700"
                            data-app-dark-img="illustrations/girl-with-laptop-dark.png"
                            data-app-light-img="illustrations/girl-with-laptop-light.png"
                        />
                    </div>
                </div>
                {/* <!-- /Left Text --> */}

                <FormRegister />
            </div>
        </>
    );
};

export default RegisterPage;
