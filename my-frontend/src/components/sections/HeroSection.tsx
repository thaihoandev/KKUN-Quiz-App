import { useState, useEffect } from "react";
import bulbLight from "@/assets/img/illustrations/bulb-light.png";
import superRocket from "@/assets/img/illustrations/rocket.png";
import { JoinRoomHero } from "../boxes/JoinRoomBox";

const HeroSection = () => {
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode từ document
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    // Check initial state
    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="card p-0 mb-6 overflow-hidden border-0 shadow-sm rounded-4">
      <div
        className="position-relative"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.15))"
            : "linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(74, 222, 128, 0.15))",
          transition: "background 0.4s ease",
          paddingTop: "3rem",
          paddingBottom: "3rem",
        }}
      >
        <div className="row g-0 align-items-center">
          {/* Left Illustration */}
          <div className="col-12 col-md-3 d-none d-md-flex justify-content-center py-5 ps-5">
            <img
              src={isDark ? bulbLight : superRocket}
              className="img-fluid"
              alt="Illustration"
              height={90}
              style={{
                maxHeight: 120,
                opacity: isDark ? 0.8 : 1,
                transition: "opacity 0.3s ease",
              }}
            />
          </div>

          {/* Center Content */}
          <div className="col-12 col-md-6 text-center py-5 px-4">
            <h2
              className="mb-3 fw-bold"
              style={{
                fontSize: "1.75rem",
                lineHeight: 1.4,
                color: "var(--text-color)",
                transition: "color 0.25s ease",
              }}
            >
              Education, talents, and career opportunities.{" "}
              <span
                className="text-nowrap"
                style={{
                  background: "var(--gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  transition: "all 0.25s ease",
                }}
              >
                All in one place
              </span>
              .
            </h2>

            <p
              className="mx-auto"
              style={{
                maxWidth: 680,
                color: "var(--text-light)",
                fontSize: "1rem",
                lineHeight: 1.6,
                transition: "color 0.25s ease",
              }}
            >
              Grow your skill with reliable online quizzes and certifications in
              marketing, IT, programming, and data science.
            </p>

            {/* JoinRoomHero Box */}
            <JoinRoomHero />
          </div>

          {/* Right Illustration */}
          <div className="col-12 col-md-3 d-none d-md-flex justify-content-center py-5 pe-5">
            <img
              src={bulbLight}
              alt="Illustration"
              height={180}
              className="img-fluid"
              style={{
                maxHeight: 180,
                opacity: isDark ? 0.8 : 1,
                transition: "opacity 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;