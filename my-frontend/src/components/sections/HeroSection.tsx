import { useState } from "react";
import bulbLight from "@/assets/img/illustrations/bulb-light.png";
import superRocket from "@/assets/img/illustrations/rocket.png";

const HeroSection = () => {
  // nếu bạn có theme, có thể thay autoDetect bằng context. Tạm thời dùng light.
  const [isDark] = useState(false);

  return (
    <div className="card p-0 mb-6 overflow-hidden border-0 shadow-sm rounded-4">
      <div
        className="position-relative"
        style={{
          background:
            "linear-gradient(135deg, rgba(13,110,253,.12), rgba(32,201,151,.12))",
        }}
      >
        <div className="row g-0 align-items-center">
          <div className="col-12 col-md-3 d-none d-md-flex justify-content-center py-5 ps-5">
            <img
              src={isDark ? bulbLight : superRocket}
              className="img-fluid"
              alt="Bulb in hand"
              height={90}
              style={{ maxHeight: 120 }}
            />
          </div>

          <div className="col-12 col-md-6 text-center py-5 px-4">
            <h2 className="mb-3 fw-bold">
              Education, talents, and career opportunities.{" "}
              <span className="text-primary text-nowrap">All in one place</span>.
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: 680 }}>
              Grow your skill with reliable online quizzes and certifications in
              marketing, IT, programming, and data science.
            </p>

            <div
              className="d-flex align-items-center justify-content-center gap-2 mt-4"
              style={{ maxWidth: 560, margin: "0 auto" }}
            >
              <input
                type="search"
                placeholder="Find your quiz"
                className="form-control form-control-lg rounded-3"
                aria-label="Search quizzes"
              />
              <button
                type="button"
                className="btn btn-primary btn-lg rounded-3"
                aria-label="Search"
              >
                <i className="icon-base bx bx-search icon-md" />
              </button>
            </div>
          </div>

          <div className="col-12 col-md-3 d-none d-md-flex justify-content-center py-5 pe-5">
            <img
              src={bulbLight}
              alt="pencil rocket"
              height={180}
              className="img-fluid"
              style={{ maxHeight: 180 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
