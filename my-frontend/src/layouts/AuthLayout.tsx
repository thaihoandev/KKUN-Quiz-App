import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { SunOutlined, MoonOutlined, GlobalOutlined } from "@ant-design/icons";

const AuthLayout: React.FC = () => {
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
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { mode: darkMode ? "dark" : "light" } }));
  }, [darkMode]);

  const toggleLanguage = () => {
    const next = language === "vi" ? "en" : "vi";
    setLanguage(next);
    localStorage.setItem("language", next);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background-color)",
        transition: "background 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 900,
              fontSize: "1rem",
            }}
          >
            K
          </div>
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            KKUN
          </span>
        </Link>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: "8px",
              border: "2px solid var(--border-color)",
              background: "var(--surface-color)",
              color: "var(--text-color)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8rem",
              transition: "var(--transition)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-color)";
              (e.currentTarget as HTMLElement).style.color = "var(--primary-color)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-color)";
            }}
          >
            {darkMode ? <MoonOutlined /> : <SunOutlined />}
          </button>

          <button
            onClick={toggleLanguage}
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--primary-color)",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8rem",
              transition: "var(--transition)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--primary-dark)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--primary-color)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <GlobalOutlined />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;