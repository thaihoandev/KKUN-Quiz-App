import React from "react";
import { GithubOutlined, LinkedinOutlined, MailOutlined } from "@ant-design/icons";

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
        background: "linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)",
        borderTop: "2px solid #e2e8f0",
        paddingTop: "3rem",
        paddingBottom: "2rem",
        marginTop: "4rem",
      }}
    >
      <div className="container-xxl">
        {/* Main Content */}
        <div className="row mb-4">
          {/* Left Section - About */}
          <div className="col-md-4 mb-3 mb-md-0">
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
              }}
            >
              <h6
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "#1a202c",
                  marginBottom: "0.75rem",
                }}
              >
                🎯 KKun Quiz
              </h6>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#718096",
                  margin: 0,
                  lineHeight: "1.6",
                }}
              >
                Interactive quiz platform để giúp bạn học tập hiệu quả và kiểm
                tra kiến thức của mình.
              </p>
            </div>
          </div>

          {/* Center Section - Navigation */}
          <div className="col-md-4 mb-3 mb-md-0">
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
              }}
            >
              <h6
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "#1a202c",
                  marginBottom: "0.75rem",
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
                      color: "#718096",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      paddingLeft: "0.5rem",
                      borderLeft: "2px solid transparent",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = "#6366f1";
                      e.currentTarget.style.borderLeftColor = "#6366f1";
                      e.currentTarget.style.paddingLeft = "0.75rem";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.color = "#718096";
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
            {/* Top - Developer Info */}
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
              }}
            >
              <h6
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "#1a202c",
                  marginBottom: "0.75rem",
                }}
              >
                👨‍💻 Người phát triển
              </h6>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#718096",
                  margin: 0,
                  marginBottom: "0.5rem",
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
                  fontWeight: "600",
                  background: "linear-gradient(135deg, #6366f1, #ec4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
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

            {/* Bottom - Social Links */}
            
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
                    borderRadius: "10px",
                    background: "white",
                    color: social.color,
                    fontSize: "1.25rem",
                    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.1)",
                    transition: "all 0.3s ease",
                    textDecoration: "none",
                    border: `2px solid ${social.color}`,
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${social.hoverColor}, #818cf8)`;
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                        "0 8px 16px rgba(99, 102, 241, 0.2)";
                    e.currentTarget.style.borderColor = "transparent";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.color = social.color;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(99, 102, 241, 0.1)";
                    e.currentTarget.style.borderColor = social.color;
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
            background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)",
            margin: "2rem 0",
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
              color: "#a0aec0",
              margin: 0,
              textAlign: "center",
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