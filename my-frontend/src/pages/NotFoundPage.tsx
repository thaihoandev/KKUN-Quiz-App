import React from "react";
import {Link} from "react-router-dom";

const NotFoundPage = () => {
    return (
        <div className="container-xxl container-p-y">
            <div className="misc-wrapper text-center">
                <h1 style={{lineHeight: "6rem", fontSize: "6rem"}}>404</h1>
                <h4 className="mb-2">Page Not Found ⚠️</h4>
                <p className="mb-6">
                    We couldn&apos;t find the page you are looking for
                </p>

                <Link to="/" className="btn btn-primary">
                    Back to Home
                </Link>

                <div className="mt-6">
                    {/*  Cập nhật đường dẫn ảnh */}
                    <img
                        src="/assets/img/illustrations/page-misc-error-light.png"
                        alt="Page Not Found"
                        width="500"
                        className="img-fluid"
                    />
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
