import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArticleDto } from "@/types/article";
import {
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  EyeOutlined,
} from "@ant-design/icons";

interface ArticleCardProps {
  article: ArticleDto;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [isDark, setIsDark] = useState(false);

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

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      BEGINNER: "#4ade80",
      INTERMEDIATE: "#fbbf24",
      ADVANCED: "#f87171",
    };
    return colors[difficulty] || "#a5b4fc";
  };

  const getDifficultyText = (difficulty: string) => {
    const texts: { [key: string]: string } = {
      BEGINNER: "Cơ bản",
      INTERMEDIATE: "Trung bình",
      ADVANCED: "Nâng cao",
    };
    return texts[difficulty] || difficulty;
  };

  const difficultyColor = getDifficultyColor(article.difficulty);

  return (
    <Link
      to={`/articles/${article.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          borderRadius: "14px",
          overflow: "hidden",
          transition: "all 0.3s ease",
          backgroundColor: "var(--surface-color)",
          display: "flex",
          flexDirection: "column",
          height: "420px",
          border: "2px solid var(--border-color)",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = "var(--hover-shadow)";
          e.currentTarget.style.borderColor = "var(--primary-color)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--card-shadow)";
          e.currentTarget.style.borderColor = "var(--border-color)";
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: "100%",
            height: "180px",
            borderRadius: "0px",
            overflow: "hidden",
            backgroundColor: "var(--surface-alt)",
            flexShrink: 0,
            margin: "0",
            padding: "0",
          }}
        >
          {article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                transition: "transform 0.4s ease",
                display: "block",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderOutlined
                style={{
                  fontSize: "3.5rem",
                  color: "white",
                  opacity: 0.7,
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "12px",
            paddingTop: "16px",
            boxSizing: "border-box",
          }}
        >
          <div>
            {/* Tags */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              {/* Difficulty Tag */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: "50px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  backgroundColor: `${difficultyColor}20`,
                  color: difficultyColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  transition: "all 0.25s ease",
                }}
              >
                {getDifficultyText(article.difficulty)}
              </span>

              {/* Category Tag */}
              {article.category && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 12px",
                    borderRadius: "50px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    backgroundColor: "var(--primary-color)20",
                    color: "var(--primary-color)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    transition: "all 0.25s ease",
                  }}
                >
                  <FolderOutlined style={{ fontSize: "0.75rem" }} />
                  {article.category.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-color)",
                marginBottom: "8px",
                lineHeight: 1.5,
                margin: 0,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "color 0.25s ease",
              }}
            >
              {article.title}
            </h4>
          </div>

          {/* Meta Info */}
          <div
            style={{
              marginTop: "10px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              transition: "color 0.25s ease",
            }}
          >
            {/* Author */}
            <div
              className="d-flex align-items-center mb-2"
              style={{
                color: "var(--text-light)",
                fontSize: "0.85rem",
              }}
            >
              <UserOutlined
                style={{
                  marginRight: "6px",
                  fontSize: "0.9rem",
                  color: "var(--primary-color)",
                }}
              />
              <span>{article.authorName || "Admin"}</span>
            </div>

            {/* Date & Reading Time & Views */}
            <div
              className="d-flex align-items-center justify-content-between"
              style={{
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ClockCircleOutlined
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--primary-color)",
                  }}
                />
                {new Date(article.createdAt).toLocaleDateString("vi-VN")} •{" "}
                {article.readingTime} phút đọc
              </span>

              {article.views !== undefined && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <EyeOutlined
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--primary-color)",
                    }}
                  />
                  {article.views}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;