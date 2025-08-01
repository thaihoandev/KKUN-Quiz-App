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
  const [schoolSearch, setSchoolSearch] = useState(formData.school || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const schoolInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Static list of schools (replace with API call if available)
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

  // Filter schools based on search input
  const filteredSchools = useMemo(() => {
    if (!schoolSearch) return schoolOptions;
    return schoolOptions.filter((school) =>
      school.toLowerCase().includes(schoolSearch.toLowerCase())
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

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow clicking an option
    setTimeout(() => setShowDropdown(false), 200);
  };

  // Close dropdown when clicking outside
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
        ...formData,
        username: profile.username, // Keep existing username
        avatar: profile.avatar, // Keep existing avatar
        role: profile.roles[0] || "player", // Keep existing role
      });
      onUpdate(updatedProfile);
      onClose();
    } catch (err: any) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      aria-labelledby="editProfileModalLabel"
      aria-hidden={!loading}
    >
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" id="editProfileModalLabel">
              Edit Profile
            </h5>
            <button
              type="button"
              className="btn-close"
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
                    className="btn-close"
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
                  required
                  readOnly
                  disabled={true}
                  placeholder="Enter your email"
                  aria-describedby="emailHelp"
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
                  required
                  disabled={loading}
                  placeholder="Enter your full name"
                  aria-describedby="nameHelp"
                />
                <div id="nameHelp" className="form-text text-muted">
                  Your name will be displayed on your profile.
                </div>
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
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  disabled={loading}
                  placeholder="Search or type school name..."
                  autoComplete="off"
                  ref={schoolInputRef}
                  aria-describedby="schoolHelp"
                  aria-autocomplete="list"
                  aria-controls="schoolDropdown"
                />
                {showDropdown && filteredSchools.length > 0 && (
                  <div
                    className="dropdown-menu show w-100 border-0 shadow-sm rounded-3 mt-1"
                    ref={dropdownRef}
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                    id="schoolDropdown"
                    role="listbox"
                  >
                    {filteredSchools.map((school) => (
                      <button
                        key={school}
                        type="button"
                        className="dropdown-item"
                        onClick={() => handleSchoolSelect(school)}
                        role="option"
                        aria-selected={formData.school === school}
                      >
                        {school}
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && filteredSchools.length === 0 && (
                  <div
                    className="dropdown-menu show w-100 border-0 shadow-sm rounded-3 mt-1"
                    ref={dropdownRef}
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    <div className="dropdown-item text-muted">No schools found</div>
                  </div>
                )}
                <div id="schoolHelp" className="form-text text-muted">
                  Optional: Select or type your school or institution.
                </div>
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
                disabled={loading || !formData.name || !formData.email}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
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