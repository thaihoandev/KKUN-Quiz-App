import { useEffect, useState } from "react";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { createPost, PostDTO, PostRequestDTO } from "@/services/postService";

type Privacy = "PUBLIC" | "FRIENDS" | "PRIVATE";

interface PostComposerProps {
  userId: string;
  avatarUrl?: string;
  onCreated?: (post: PostDTO) => void;
  maxImages?: number;
  defaultPrivacy?: Privacy;
}

const PostComposer: React.FC<PostComposerProps> = ({
  userId,
  avatarUrl,
  onCreated,
  maxImages = 5,
  defaultPrivacy = "PUBLIC",
}) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<Privacy>(defaultPrivacy);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".privacy-dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Preview URLs
  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const remaining = Math.max(0, maxImages - images.length);
    const next = files.slice(0, remaining);
    setImages((prev) => [...prev, ...next]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      setError("Please add content or images to post");
      return;
    }
    if (!userId) {
      setError("User ID is required to create a post");
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const mediaWithDimensions = await Promise.all(
        images.map(async (file, index) => {
          const { width, height } = await getImageDimensions(file);
          return {
            mimeType: file.type,
            sizeBytes: file.size,
            width,
            height,
            caption: "",
            isCover: index === 0,
          };
        })
      );

      const postData: PostRequestDTO = {
        content,
        privacy,
        media: mediaWithDimensions,
      };

      const formData = new FormData();
      formData.append("post", new Blob([JSON.stringify(postData)], { type: "application/json" }));
      images.forEach((file) => formData.append("mediaFiles", file));

      const created: PostDTO = await createPost(userId, formData);
      onCreated?.(created);

      // Reset
      setContent("");
      setImages([]);
      setPrivacy(defaultPrivacy);
      setError(null);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      className="card shadow-sm mb-4 border-0 rounded-4"
      style={{
        background: "var(--surface-color)",
        border: "2px solid var(--border-color)",
        borderRadius: "14px",
        transition: "all 0.25s ease",
      }}
    >
      <div className="card-body p-4">
        {/* Error Alert */}
        {error && (
          <div
            className="alert alert-dismissible mb-3"
            role="alert"
            style={{
              background: "var(--surface-alt)",
              borderLeft: "4px solid var(--danger-color)",
              color: "var(--danger-color)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem",
              animation: "slideInUp 0.3s ease forwards",
            }}
          >
            <i
              className="bx bx-error-circle"
              style={{
                fontSize: "1.1rem",
                flexShrink: 0,
              }}
            ></i>
            <span style={{ flex: 1 }}>{error}</span>
            <button
              className="btn p-0"
              onClick={() => setError(null)}
              style={{
                background: "transparent",
                color: "var(--danger-color)",
                border: "none",
                cursor: "pointer",
                fontSize: "1.1rem",
              }}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
        )}

        {/* Top Row: Avatar + Input */}
        <div
          className="d-flex align-items-center gap-3 mb-3"
          style={{
            transition: "all 0.25s ease",
          }}
        >
          <img
            src={avatarUrl || unknownAvatar}
            alt="me"
            className="rounded-circle"
            width={44}
            height={44}
            style={{
              objectFit: "cover",
              border: "2px solid var(--border-color)",
              transition: "all 0.25s ease",
            }}
          />
          <input
            className="form-control form-control-lg rounded-pill"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
            style={{
              background: "var(--surface-alt)",
              color: "var(--text-color)",
              border: "2px solid var(--border-color)",
              transition: "all 0.25s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--primary-color)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(96, 165, 250, 0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Image Previews */}
        {!!previews.length && (
          <div
            className="d-flex flex-wrap gap-2 mb-3"
            style={{
              padding: "1rem",
              background: "var(--surface-alt)",
              borderRadius: "12px",
              animation: "slideInUp 0.3s ease forwards",
            }}
          >
            {previews.map((src, idx) => (
              <div
                key={idx}
                className="position-relative"
                style={{
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <img
                  src={src}
                  alt="preview"
                  style={{
                    width: "96px",
                    height: "96px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "2px solid var(--border-color)",
                  }}
                />
                <button
                  className="btn btn-sm position-absolute top-0 end-0 p-0"
                  style={{
                    width: "24px",
                    height: "24px",
                    lineHeight: "24px",
                    transform: "translate(50%, -50%)",
                    background: "var(--danger-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isPosting ? "not-allowed" : "pointer",
                    opacity: isPosting ? 0.6 : 1,
                    transition: "all 0.25s ease",
                  }}
                  onClick={() => removeImage(idx)}
                  disabled={isPosting}
                  aria-label="Remove image"
                  onMouseEnter={(e) => {
                    if (!isPosting) {
                      e.currentTarget.style.background = "var(--danger-dark)";
                      e.currentTarget.style.transform = "translate(50%, -50%) scale(1.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPosting) {
                      e.currentTarget.style.background = "var(--danger-color)";
                      e.currentTarget.style.transform = "translate(50%, -50%) scale(1)";
                    }
                  }}
                >
                  <i className="bx bx-x" style={{ fontSize: "1rem", margin: 0 }}></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Row: Action Buttons */}
        <div
          className="d-flex gap-2 flex-wrap align-items-center"
          style={{
            transition: "all 0.25s ease",
          }}
        >
          {/* Photo/Video Button */}
          <label
            className="btn btn-sm rounded-pill px-3 mb-0"
            style={{
              background: "var(--surface-alt)",
              color: "var(--text-light)",
              border: "2px solid var(--border-color)",
              fontWeight: 600,
              cursor: isPosting || images.length >= maxImages ? "not-allowed" : "pointer",
              opacity: isPosting || images.length >= maxImages ? 0.6 : 1,
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              if (!(isPosting || images.length >= maxImages)) {
                e.currentTarget.style.background = "var(--primary-color)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
            onMouseLeave={(e) => {
              if (!(isPosting || images.length >= maxImages)) {
                e.currentTarget.style.background = "var(--surface-alt)";
                e.currentTarget.style.color = "var(--text-light)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }
            }}
          >
            <i className="bx bx-image-alt"></i>
            <span>Photo/Video</span>
            <input
              type="file"
              accept="image/*"
              hidden
              multiple
              onChange={handleImageChange}
              disabled={isPosting || images.length >= maxImages}
            />
          </label>

          {/* Poll Button (Disabled) */}
          <button
            className="btn btn-sm rounded-pill px-3"
            type="button"
            disabled
            title="Coming soon"
            style={{
              background: "var(--surface-alt)",
              color: "var(--text-muted)",
              border: "2px solid var(--border-color)",
              fontWeight: 600,
              cursor: "not-allowed",
              opacity: 0.5,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="bx bx-poll"></i>
            <span>Poll</span>
          </button>

          {/* Feeling/Activity Button (Disabled) */}
          <button
            className="btn btn-sm rounded-pill px-3"
            type="button"
            disabled
            title="Coming soon"
            style={{
              background: "var(--surface-alt)",
              color: "var(--text-muted)",
              border: "2px solid var(--border-color)",
              fontWeight: 600,
              cursor: "not-allowed",
              opacity: 0.5,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="bx bx-smile"></i>
            <span>Feeling/Activity</span>
          </button>

          {/* Privacy Dropdown */}
          <div
            className="privacy-dropdown"
            style={{
              position: "relative",
            }}
          >
            <button
              className="btn btn-sm rounded-pill px-3"
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isPosting}
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-light)",
                border: "2px solid var(--border-color)",
                fontWeight: 600,
                cursor: isPosting ? "not-allowed" : "pointer",
                opacity: isPosting ? 0.6 : 1,
                transition: "all 0.25s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (!isPosting) {
                  e.currentTarget.style.background = "var(--primary-color)";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
              onMouseLeave={(e) => {
                if (!isPosting) {
                  e.currentTarget.style.background = "var(--surface-alt)";
                  e.currentTarget.style.color = "var(--text-light)";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }
              }}
            >
              <i
                className={`bx ${
                  privacy === "PUBLIC"
                    ? "bx-globe"
                    : privacy === "FRIENDS"
                    ? "bx-group"
                    : "bx-lock"
                }`}
              ></i>
              <span>
                {privacy === "PUBLIC" ? "Public" : privacy === "FRIENDS" ? "Friends" : "Private"}
              </span>
            </button>

            {isDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.5rem)",
                  left: 0,
                  background: "var(--surface-color)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "12px",
                  boxShadow: "var(--hover-shadow)",
                  minWidth: "160px",
                  zIndex: 1000,
                  overflow: "hidden",
                  animation: "slideInUp 0.3s ease forwards",
                }}
              >
                {[
                  { value: "PUBLIC" as Privacy, icon: "bx-globe", label: "Public" },
                  { value: "FRIENDS" as Privacy, icon: "bx-group", label: "Friends" },
                  { value: "PRIVATE" as Privacy, icon: "bx-lock", label: "Private" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPrivacy(option.value);
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "none",
                      background: privacy === option.value ? "var(--gradient-primary)" : "transparent",
                      color: privacy === option.value ? "white" : "var(--text-color)",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: privacy === option.value ? 600 : 500,
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (privacy !== option.value) {
                        e.currentTarget.style.background = "var(--surface-alt)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (privacy !== option.value) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <i className={`bx ${option.icon}`}></i>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Post Button */}
          <button
            className="btn btn-sm rounded-pill px-4 ms-auto"
            onClick={handlePost}
            disabled={isPosting || (!content.trim() && images.length === 0)}
            style={{
              background: "var(--gradient-primary)",
              color: "white",
              border: "none",
              fontWeight: 600,
              cursor: isPosting || (!content.trim() && images.length === 0) ? "not-allowed" : "pointer",
              opacity: isPosting || (!content.trim() && images.length === 0) ? 0.6 : 1,
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              if (!(isPosting || (!content.trim() && images.length === 0))) {
                e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!(isPosting || (!content.trim() && images.length === 0))) {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {isPosting ? (
              <>
                <i
                  className="bx bx-loader-alt bx-spin"
                  style={{
                    fontSize: "0.9rem",
                    animation: "spin 1s linear infinite",
                  }}
                ></i>
                <span>Posting…</span>
              </>
            ) : (
              <>
                <i className="bx bx-send" style={{ fontSize: "0.9rem" }}></i>
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default PostComposer;