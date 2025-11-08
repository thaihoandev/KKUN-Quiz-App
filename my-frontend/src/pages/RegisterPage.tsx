import React from "react";
import FormRegister from "@/components/forms/FormRegister";

const RegisterPage: React.FC = () => {
  return (
    <div 
      style={{ 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%", 
        height: "100%",
        padding: "2rem",
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        .register-hero { animation: slideInLeft 0.8s ease-out; }
        .register-form { animation: slideInRight 0.8s ease-out; }
        .floating-element { animation: float 3s ease-in-out infinite; }

        @media (max-width: 1024px) {
          .register-hero { display: none !important; }
          .register-form { gridColumn: 1 / -1; }
        }
      `}</style>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          width: "100%",
          height: "100%",
          maxWidth: "1200px",
          gap: 0,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Left Hero Section */}
        <div
          className="register-hero d-none d-lg-flex"
          style={{
            background: "var(--gradient-primary)",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            padding: "2rem",
          }}
        >
          {/* Animated Background */}
          <div
            className="floating-element"
            style={{
              position: "absolute",
              top: "10%",
              right: "5%",
              width: "300px",
              height: "300px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              filter: "blur(80px)",
            }}
          />
          <div
            className="floating-element"
            style={{
              position: "absolute",
              bottom: "5%",
              left: "10%",
              width: "250px",
              height: "250px",
              background: "rgba(255, 255, 255, 0.06)",
              borderRadius: "50%",
              filter: "blur(70px)",
              animationDelay: "1s",
            }}
          />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 10, textAlign: "center", color: "white", maxWidth: "350px" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "0.8rem", letterSpacing: "-1px" }}>
              Join KKUN
            </h1>
            <p style={{ fontSize: "1rem", marginBottom: "2.5rem", fontWeight: 500, opacity: 0.9 }}>
              Start Your Adventure 🚀
            </p>

            <div style={{ display: "grid", gap: "1.2rem" }}>
              {[
                { icon: "✨", title: "Create Account", desc: "Join millions of players" },
                { icon: "🎯", title: "Play Quizzes", desc: "Test your knowledge" },
                { icon: "🏆", title: "Win Rewards", desc: "Climb the leaderboard" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.8rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1.8rem" }}>{item.icon}</span>
                  <div>
                    <h5 style={{ margin: "0 0 0.1rem", fontWeight: 700, fontSize: "0.9rem" }}>
                      {item.title}
                    </h5>
                    <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div
          className="register-form"
          style={{
            background: "var(--background-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            overflow: "hidden",
          }}
        >
          <FormRegister />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;