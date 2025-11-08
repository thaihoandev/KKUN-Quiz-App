import { useState, useMemo, useRef, useEffect } from "react";
import { updateMyProfile } from "@/services/userService";
import { User } from "@/types/users";

interface EditProfileModalProps {
  profile: User;
  onClose: () => void;
  onUpdate: (updatedProfile: User) => void;
}

const EditProfileModal = ({ profile, onClose, onUpdate }: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    email: profile?.email || "",
    name: profile?.name || "",
    school: profile?.school || "",
  });
  const [schoolSearch, setSchoolSearch] = useState(profile?.school || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const schoolInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData({
      email: profile?.email || "",
      name: profile?.name || "",
      school: profile?.school || "",
    });
    setSchoolSearch(profile?.school || "");
  }, [profile?.email, profile?.name, profile?.school]);

  const schoolOptions = [
    "Harvard University",
    "Stanford University",
    "Massachusetts Institute of Technology",
    "University of California, Berkeley",
    "Oxford University",
    "Cambridge University",
    "Ho Chi Minh University of Technology",
    "Vietnam National University, Hanoi",
    "Yale University",
    "Princeton University",
  ];

  const filteredSchools = useMemo(() => {
    if (!schoolSearch) return schoolOptions;
    return schoolOptions.filter((s) =>
      s.toLowerCase().includes(schoolSearch.toLowerCase())
    );
  }, [schoolSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "school") {
      setSchoolSearch(value);
      setShowDropdown(true);
    }
  };

  const handleSchoolSelect = (school: string) => {
    setFormData((prev) => ({ ...prev, school }));
    setSchoolSearch(school);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        schoolInputRef.current &&
        !schoolInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await updateMyProfile({
        name: formData.name.trim(),
        school: formData.school.trim(),
      });
      onUpdate(updatedProfile);
      onClose();
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSaveDisabled = loading || !formData.name.trim();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 2000,
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          transform: "translateY(10px)",
          animation: "slideUp 0.35s ease forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "var(--surface-color)",
            border: "none",
            borderRadius: "var(--border-radius)",
            overflow: "hidden",
            boxShadow: "var(--card-shadow)",
            position: "relative",
            color: "var(--text-color)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--gradient-primary)",
              borderBottom: "none",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h5
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "white",
              }}
            >
              Edit Profile
            </h5>
            
            {/* Close Button - Bootstrap style */}
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "1.5rem" }}>
              {/* Error Alert */}
              {error && (
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--danger-color)",
                    color: "white",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      fontSize: "18px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Email Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                  }}
                >
                  Email <span style={{ color: "var(--danger-color)" }}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "var(--surface-alt)",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    cursor: "not-allowed",
                  }}
                  placeholder="Your email"
                />
                <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.5rem" }}>
                  Email cannot be changed.
                </small>
              </div>

              {/* Name Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="name"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                  }}
                >
                  Full Name <span style={{ color: "var(--danger-color)" }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "var(--surface-color)",
                    color: "var(--text-color)",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                    outline: "none",
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "not-allowed" : "text",
                  }}
                  placeholder="Enter your full name"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary-color)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* School Field */}
              <div style={{ marginBottom: "1.5rem", position: "relative" }}>
                <label
                  htmlFor="school"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                  }}
                >
                  School
                </label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  value={schoolSearch}
                  onChange={handleChange}
                  disabled={loading}
                  ref={schoolInputRef}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "2px solid var(--border-color)",
                    borderRadius: "10px",
                    background: "var(--surface-color)",
                    color: "var(--text-color)",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                    outline: "none",
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "not-allowed" : "text",
                  }}
                  placeholder="Search or type school name..."
                  autoComplete="off"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary-color)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />

                {/* School Dropdown */}
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 0.5rem)",
                      left: 0,
                      right: 0,
                      background: "var(--surface-color)",
                      border: "2px solid var(--border-color)",
                      borderRadius: "10px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      boxShadow: "var(--card-shadow)",
                      zIndex: 10,
                    }}
                  >
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <button
                          key={school}
                          type="button"
                          onClick={() => handleSchoolSelect(school)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "0.75rem 1rem",
                            border: "none",
                            background: "transparent",
                            color: "var(--text-color)",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.25s ease",
                            fontSize: "14px",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--surface-alt)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {school}
                        </button>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          color: "var(--text-muted)",
                          fontSize: "14px",
                        }}
                      >
                        No schools found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                padding: "1rem 1.5rem",
                background: "var(--surface-alt)",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "2px solid var(--border-color)",
                  borderRadius: "10px",
                  background: "transparent",
                  color: "var(--text-color)",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "var(--surface-color)";
                    e.currentTarget.style.borderColor = "var(--text-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaveDisabled}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "10px",
                  background: "var(--gradient-primary)",
                  color: "white",
                  fontWeight: 600,
                  cursor: isSaveDisabled ? "not-allowed" : "pointer",
                  opacity: isSaveDisabled ? 0.5 : 1,
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  if (!isSaveDisabled) {
                    e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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

export default EditProfileModal;