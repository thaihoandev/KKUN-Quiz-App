import React, { useEffect, useState } from "react";
import {
  GithubOutlined,
  InstagramOutlined,
  TikTokOutlined,
  YoutubeOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
  HeartFilled,
  ThunderboltFilled,
  ShareAltOutlined,
  FireOutlined,
  TeamOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [language, setLanguage] = useState<string>(() =>
    localStorage.getItem("language") || "en"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.setAttribute("data-color-mode", darkMode ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { mode: darkMode ? "dark" : "light" } }));
  }, [darkMode]);

  const toggleLanguage = () => {
    const next = language === "vi" ? "en" : "vi";
    setLanguage(next);
    localStorage.setItem("language", next);
  };

  const stats = [
    { icon: <FireOutlined />, value: "10K+", label: language === "vi" ? "Quiz Nóng" : "Hot Quizzes" },
    { icon: <TeamOutlined />, value: "500K+", label: language === "vi" ? "Cộng Đồng" : "Members" },
    { icon: <ThunderboltFilled />, value: "50M+", label: language === "vi" ? "Lần Chơi" : "Plays" },
  ];

  const mainLinks = [
    { label: language === "vi" ? "Quiz Trending" : "Trending Quizzes", href: "/quiz/trending" },
    { label: language === "vi" ? "Bảng Xếp Hạng" : "Leaderboard", href: "/leaderboard" },
    { label: language === "vi" ? "Tạo Quiz" : "Create Quiz", href: "/create" },
  ];

  const newsLinks = [
    { label: language === "vi" ? "Tin Giải Trí" : "Entertainment", href: "/news/entertainment" },
    { label: language === "vi" ? "Xu Hướng" : "Trends", href: "/news/trends" },
  ];

  const socials = [
    { icon: InstagramOutlined, href: "https://instagram.com", label: "Instagram" },
    { icon: TikTokOutlined, href: "https://tiktok.com", label: "TikTok" },
    { icon: YoutubeOutlined, href: "https://youtube.com", label: "YouTube" },
    { icon: GithubOutlined, href: "https://github.com", label: "GitHub" },
  ];

  return (
    <footer 
      className="card" 
      style={{ 
        marginBottom: 0, 
        marginTop: "4rem", 
        borderRadius: 0,
        border: "none",
        borderTop: "2px solid var(--border-color)",
      }}
    >
      <div className="container-xxl py-5">
        {/* HEADER */}
        <div className="row mb-5">
          <div className="col-12 text-center">
            <h4 style={{ color: "var(--primary-color)", fontWeight: 900, marginBottom: "0.5rem", fontSize: "2rem" }}>
              KKUN
            </h4>
            <p style={{ color: "var(--text-light)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto" }}>
              {language === "vi"
                ? "Nền tảng quiz xã hội với tin tức thời sự. Chơi, khám phá, kết nối."
                : "Social quiz platform with trending news. Play, discover, connect."}
            </p>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="row g-4 mb-5">
          {/* OVERVIEW STATS */}
          <div className="col-lg-3 col-md-6">
            <div style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--surface-alt)", height: "100%" }}>
              <h6 className="fw-bold mb-3" style={{ color: "var(--primary-color)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, whiteSpace: "nowrap" }}>
                <ThunderboltFilled style={{ marginRight: "0.5rem" }} />
                Overview
              </h6>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.8rem 1rem",
                      borderRadius: "8px",
                      background: "var(--surface-color)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                    }}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = "var(--gradient-primary)";
                      target.style.border = "1px solid var(--primary-color)";
                      target.style.transform = "translateX(4px)";
                      target.style.boxShadow = "0 6px 12px rgba(96, 165, 250, 0.15)";
                      const value = target.querySelector(".stat-value") as HTMLElement;
                      const label = target.querySelector(".stat-label") as HTMLElement;
                      if (value) value.style.color = "white";
                      if (label) label.style.color = "rgba(255,255,255,0.85)";
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = "var(--surface-color)";
                      target.style.border = "1px solid var(--border-color)";
                      target.style.transform = "translateX(0)";
                      target.style.boxShadow = "none";
                      const value = target.querySelector(".stat-value") as HTMLElement;
                      const label = target.querySelector(".stat-label") as HTMLElement;
                      if (value) value.style.color = "var(--primary-color)";
                      if (label) label.style.color = "var(--text-light)";
                    }}
                  >
                    <div style={{ fontSize: "1.4rem", color: "var(--primary-color)", minWidth: "1.8rem", textAlign: "center" }}>
                      {stat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="stat-value" style={{ fontSize: "1rem", fontWeight: 900, color: "var(--primary-color)", transition: "color 0.3s ease", lineHeight: 1.2 }}>
                        {stat.value}
                      </div>
                      <div className="stat-label" style={{ fontSize: "0.7rem", color: "var(--text-light)", transition: "color 0.3s ease", marginTop: "0.15rem", lineHeight: 1.2 }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QUIZ SECTION */}
          <div className="col-lg-3 col-md-6">
            <div style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--surface-alt)", height: "100%" }}>
              <h6 className="fw-bold mb-4" style={{ color: "var(--primary-color)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                <ThunderboltFilled style={{ marginRight: "0.5rem" }} />
                Quiz
              </h6>
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {mainLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      color: "var(--text-light)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      padding: "0.6rem 0.9rem",
                      borderRadius: "6px",
                      transition: "all 0.25s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: "3px solid transparent",
                    }}
                    className="text-decoration-none"
                    onMouseEnter={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = "var(--surface-color)";
                      target.style.color = "var(--primary-color)";
                      target.style.borderLeftColor = "var(--primary-color)";
                      target.style.paddingLeft = "1.1rem";
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = "transparent";
                      target.style.color = "var(--text-light)";
                      target.style.borderLeftColor = "transparent";
                      target.style.paddingLeft = "0.9rem";
                    }}
                  >
                    <span>{link.label}</span>
                    <ArrowRightOutlined style={{ fontSize: "0.75rem" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* NEWS SECTION */}
          <div className="col-lg-3 col-md-6">
            <div style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--surface-alt)", height: "100%" }}>
              <h6 className="fw-bold mb-4" style={{ color: "var(--danger-color)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                <FireOutlined style={{ marginRight: "0.5rem" }} />
                News
              </h6>
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {newsLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      color: "var(--text-light)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      padding: "0.6rem 0.9rem",
                      borderRadius: "6px",
                      transition: "all 0.25s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: "3px solid transparent",
                    }}
                    className="text-decoration-none"
                    onMouseEnter={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = "var(--surface-color)";
                      target.style.color = "var(--danger-color)";
                      target.style.borderLeftColor = "var(--danger-color)";
                      target.style.paddingLeft = "1.1rem";
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = "transparent";
                      target.style.color = "var(--text-light)";
                      target.style.borderLeftColor = "transparent";
                      target.style.paddingLeft = "0.9rem";
                    }}
                  >
                    <span>{link.label}</span>
                    <ArrowRightOutlined style={{ fontSize: "0.75rem" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* SOCIAL SECTION */}
          <div className="col-lg-3 col-md-6">
            <div style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--surface-alt)", height: "100%" }}>
              <h6 className="fw-bold mb-4" style={{ color: "var(--info-color)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                <ShareAltOutlined style={{ marginRight: "0.5rem" }} />
                Connect
              </h6>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.8rem" }}>
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      title={s.label}
                      style={{
                        padding: "0.8rem",
                        borderRadius: "8px",
                        background: "var(--surface-color)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        color: "var(--primary-color)",
                        fontSize: "1rem",
                        transition: "all 0.25s ease",
                        textDecoration: "none",
                        border: "1px solid var(--border-color)",
                      }}
                      className="text-decoration-none"
                      onMouseEnter={(e) => {
                        const target = e.currentTarget as HTMLElement;
                        target.style.background = "var(--gradient-primary)";
                        target.style.color = "white";
                        target.style.transform = "translateY(-3px)";
                        target.style.borderColor = "var(--primary-color)";
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget as HTMLElement;
                        target.style.background = "var(--surface-color)";
                        target.style.color = "var(--primary-color)";
                        target.style.transform = "translateY(0)";
                        target.style.borderColor = "var(--border-color)";
                      }}
                    >
                      <Icon />
                      <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>{s.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height: "1px", background: "var(--border-color)", marginBottom: "2rem" }} />

        {/* BOTTOM */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-light)", fontWeight: 500 }}>
              © {currentYear} <strong style={{ color: "#ff6b6b" }}>KKUN</strong> Quiz Platform
            </p>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {language === "vi" ? "Chơi • Khám phá • Kết nối" : "Play • Discover • Connect"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-outline-primary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? <MoonOutlined /> : <SunOutlined />}
            </button>

            <button
              onClick={toggleLanguage}
              className="btn btn-primary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              title={language === "vi" ? "English" : "Tiếng Việt"}
            >
              <GlobalOutlined /> {language.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;