import { useState, useMemo, useRef, useEffect } from "react";
import { updateUser } from "@/services/userService";
import { UserResponseDTO } from "@/interfaces";

interface EditProfileModalProps {
  profile: UserResponseDTO;
  onClose: () => void;
  onUpdate: (updatedProfile: UserResponseDTO) => void;
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

  // ✅ Sync lại form khi profile thay đổi
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
      const updatedProfile = await updateUser(profile.userId, {
        name: formData.name.trim(),
        school: formData.school.trim(),
        // KHÔNG gửi email/role nếu BE không cho phép đổi
        // email: formData.email,
        // role: profile.roles?.[0],
        // username: profile.username,
        // avatar: profile.avatar,
      });
      onUpdate(updatedProfile);
      onClose();
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSaveDisabled = loading 

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      aria-labelledby="editProfileModalLabel"
      aria-hidden={false}
    >
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" id="editProfileModalLabel">
              Edit Profile
            </h5>
            <button
              type="button"
              className="btn btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body pt-3">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button
                    type="button"
                    className="btn btn-close"
                    onClick={() => setError(null)}
                    aria-label="Dismiss error"
                  ></button>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="email" className="form-label fw-medium text-dark">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control form-control-lg rounded-3 shadow-sm"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly
                  // ❌ không cần disabled; để user thấy rõ vẫn có value
                  placeholder="Your email"
                />
                <div id="emailHelp" className="form-text text-muted">
                  Email cannot be changed.
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="name" className="form-label fw-medium text-dark">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-3 shadow-sm"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="mb-4 position-relative">
                <label htmlFor="school" className="form-label fw-medium text-dark">
                  School
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-3 shadow-sm"
                  id="school"
                  name="school"
                  value={schoolSearch}
                  onChange={handleChange}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  disabled={loading}
                  placeholder="Search or type school name..."
                  autoComplete="off"
                  ref={schoolInputRef}
                  aria-controls="schoolDropdown"
                />
                {showDropdown && (
                  <div
                    className="dropdown-menu show w-100 border-0 shadow-sm rounded-3 mt-1"
                    ref={dropdownRef}
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                    id="schoolDropdown"
                  >
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <button
                          key={school}
                          type="button"
                          className="dropdown-item"
                          onClick={() => handleSchoolSelect(school)}
                        >
                          {school}
                        </button>
                      ))
                    ) : (
                      <div className="dropdown-item text-muted">No schools found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-4"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm px-4"
                disabled={isSaveDisabled}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
