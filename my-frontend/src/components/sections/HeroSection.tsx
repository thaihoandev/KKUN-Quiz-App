import { useEffect } from "react";

const HeroSection = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "@/assets/js/app-academy-course.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="card p-0 mb-6">
      <div className="card-body d-flex flex-column flex-md-row justify-content-between p-0 pt-6">
        <div className="app-academy-md-25 card-body py-0 pt-6 ps-12">
          <img
            src="../../assets/img/illustrations/bulb-light.png"
            className="img-fluid app-academy-img-height scaleX-n1-rtl"
            alt="Bulb in hand"
            data-app-light-img="illustrations/bulb-light.png"
            data-app-dark-img="illustrations/bulb-dark.png"
            height="90"
          />
        </div>
        <div className="app-academy-md-50 card-body d-flex align-items-md-center flex-column text-md-center mb-6 py-6">
          <span className="card-title mb-4 px-md-12 h4">
            Education, talents, and career
            <br />
            opportunities.{" "}
            <span className="text-primary text-nowrap">All in one place</span>.
          </span>
          <p className="mb-4">
            Grow your skill with the most reliable online quizzes and
            certifications in marketing, information technology, programming, and
            data science.
          </p>
          <div className="d-flex align-items-center justify-content-between app-academy-md-80">
            <input
              type="search"
              placeholder="Find your quiz"
              className="form-control me-4"
            />
            <button type="submit" className="btn btn-primary btn-icon">
              <i className="icon-base bx bx-search icon-md"></i>
            </button>
          </div>
        </div>
        <div className="app-academy-md-25 d-flex align-items-end justify-content-end">
          <img
            src="../../assets/img/illustrations/pencil-rocket.png"
            alt="pencil rocket"
            height="180"
            className="scaleX-n1-rtl"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;