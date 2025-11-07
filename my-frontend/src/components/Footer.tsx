import React, { useEffect, useState } from "react";
import {
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
} from "@ant-design/icons";

const Footer = () => {
  const [isDark, setIsDark] = useState(false);
  const currentYear = new Date().getFullYear();

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const socialLinks = [
    {
      icon: GithubOutlined,
      href: "https://github.com/thaihoandev",
      label: "GitHub",
      color: "#1a202c",
      hoverColor: "#6366f1",
    },
    {
      icon: LinkedinOutlined,
      href: "https://linkedin.com/in/thaihoandev",
      label: "LinkedIn",
      color: "#0a66c2",
      hoverColor: "#ec4899",
    },
    {
      icon: MailOutlined,
      href: "mailto:ngothaihoan1103@gmail.com",
      label: "Email",
      color: "#ef4444",
      hoverColor: "#6366f1",
    },
  ];

  const navLinks = [
    { label: "About", href: "https://kkun-quiz.vercel.app/about" },
    { label: "Projects", href: "https://kkun-quiz.vercel.app/projects" },
    { label: "Blog", href: "https://kkun-quiz.vercel.app/blog" },
    { label: "Contact", href: "mailto:thaihoan.dev@gmail.com" },
  ];

  return (
    <footer
      className="content-footer mt-auto"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
          : "linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)",
        borderTop: "2px solid var(--border-color)",
        paddingTop: "3rem",
        paddingBottom: "2rem",
        marginTop: "4rem",
        transition: "background 0.4s ease, border-color 0.25s ease",
      }}
    >
      <div className="container-xxl">
        {/* Main Content */}
        <div className="row mb-4 g-3">
          {/* Left Section - About */}
          <div className="col-md-4">
            <div
              style={{
                background: "var(--surface-color)",
                padding: "1.5rem",
                borderRadius: "14px",
                border: "2px solid var(--border-color)",
                boxShadow: "var(--card-shadow)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                e.currentTarget.style.borderColor = "var(--primary-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--card-shadow)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              <h6
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  marginBottom: "0.75rem",
                  transition: "color 0.25s ease",
                }}
              >
                🎯 KKun Quiz
              </h6>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-light)",
                  margin: 0,
                  lineHeight: 1.6,
                  transition: "color 0.25s ease",
                }}
              >
                Interactive quiz platform để giúp bạn học tập hiệu quả và kiểm
                tra kiến thức của mình.
              </p>
            </div>
          </div>

          {/* Center Section - Navigation */}
          <div className="col-md-4">
            <div
              style={{
                background: "var(--surface-color)",
                padding: "1.5rem",
                borderRadius: "14px",
                border: "2px solid var(--border-color)",
                boxShadow: "var(--card-shadow)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                e.currentTarget.style.borderColor = "var(--primary-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--card-shadow)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              <h6
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  marginBottom: "0.75rem",
                  transition: "color 0.25s ease",
                }}
              >
                🔗 Điều hướng
              </h6>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-light)",
                      textDecoration: "none",
                      transition: "all 0.25s ease",
                      paddingLeft: "0.5rem",
                      borderLeft: "2px solid transparent",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = "var(--primary-color)";
                      e.currentTarget.style.borderLeftColor = "var(--primary-color)";
                      e.currentTarget.style.paddingLeft = "0.75rem";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = "var(--text-light)";
                      e.currentTarget.style.borderLeftColor = "transparent";
                      e.currentTarget.style.paddingLeft = "0.5rem";
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section - Developer Info */}
          <div className="col-md-4 d-flex flex-column gap-3">
            {/* Developer Info */}
            <div
              style={{
                background: "var(--surface-color)",
                padding: "1.5rem",
                borderRadius: "14px",
                border: "2px solid var(--border-color)",
                boxShadow: "var(--card-shadow)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                e.currentTarget.style.borderColor = "var(--primary-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--card-shadow)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              <h6
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--text-color)",
                  marginBottom: "0.75rem",
                  transition: "color 0.25s ease",
                }}
              >
                👨‍💻 Người phát triển
              </h6>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-light)",
                  margin: 0,
                  marginBottom: "0.5rem",
                  transition: "color 0.25s ease",
                }}
              >
                Built with ❤️ by
              </p>
              <a
                href="https://kkun-quiz.vercel.app"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  background: "var(--gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                Thái Hoàn Dev
              </a>
            </div>

            {/* Social Links */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    title={social.label}
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "12px",
                      background: "var(--surface-color)",
                      color: "var(--primary-color)",
                      fontSize: "1.25rem",
                      boxShadow: "var(--card-shadow)",
                      transition: "all 0.25s ease",
                      textDecoration: "none",
                      border: "2px solid var(--border-color)",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.background =
                        "var(--gradient-primary)";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.background = "var(--surface-color)";
                      e.currentTarget.style.color = "var(--primary-color)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "var(--card-shadow)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    }}
                  >
                    <IconComponent />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: `linear-gradient(90deg, transparent, var(--border-color), transparent)`,
            margin: "2rem 0",
            transition: "background 0.25s ease",
          }}
        />

        {/* Bottom Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          {/* Copyright */}
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              margin: 0,
              textAlign: "center",
              transition: "color 0.25s ease",
            }}
          >
            © {currentYear} KKun Quiz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;