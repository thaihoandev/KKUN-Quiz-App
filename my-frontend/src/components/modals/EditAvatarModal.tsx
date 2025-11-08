import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { updateMyAvatar } from "@/services/userService";
import { User } from "@/types/users";

interface EditAvatarModalProps {
  profile: User;
  onClose: () => void;
  onUpdate: (updatedProfile: User) => void;
}

const getCroppedImg = async (imageSrc: string, croppedAreaPixels: Area): Promise<File> => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      const { width, height } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        width,
        height,
        0,
        0,
        width,
        height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.95
      );
    };
    image.onerror = () => reject(new Error("Failed to load image"));
  });
};

const EditAvatarModal = ({ profile, onClose, onUpdate }: EditAvatarModalProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError("Please select and crop an image");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const updatedProfile = await updateMyAvatar(croppedImage);
      onUpdate(updatedProfile);
      onClose();
    } catch (err: any) {
      setError("Failed to update avatar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              Edit Avatar
            </h5>

            {/* Close Button */}
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              style={{
                filter: "brightness(0) invert(1)",
              }}
            ></button>
          </div>

          {/* Body */}
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

            {/* File Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="avatarFile"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-color)",
                  fontSize: "14px",
                }}
              >
                Choose Image
              </label>
              <input
                type="file"
                id="avatarFile"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid var(--border-color)",
                  borderRadius: "10px",
                  background: "var(--surface-color)",
                  color: "var(--text-color)",
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.25s ease",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.5rem" }}>
                Supported formats: JPEG, PNG (Max 5MB)
              </small>
            </div>

            {/* Cropper */}
            {imageSrc && (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "400px",
                  height: "400px",
                  margin: "0 auto 1.5rem",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "2px solid var(--border-color)",
                  background: "var(--surface-alt)",
                }}
              >
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: {
                      borderRadius: "10px",
                      background: "var(--surface-alt)",
                    },
                    cropAreaStyle: {
                      border: "3px solid var(--primary-color)",
                      borderRadius: "50%",
                    },
                  }}
                />
              </div>
            )}

            {/* Zoom Slider */}
            {imageSrc && (
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--text-color)",
                    fontSize: "14px",
                  }}
                >
                  Zoom
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  disabled={loading}
                  style={{
                    width: "100%",
                    accentColor: "var(--primary-color)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                />
              </div>
            )}
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
              type="button"
              onClick={handleSubmit}
              disabled={loading || !imageSrc || !croppedAreaPixels}
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "10px",
                background: "var(--gradient-primary)",
                color: "white",
                fontWeight: 600,
                cursor: loading || !imageSrc || !croppedAreaPixels ? "not-allowed" : "pointer",
                opacity: loading || !imageSrc || !croppedAreaPixels ? 0.5 : 1,
                transition: "all 0.25s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (!loading && imageSrc && croppedAreaPixels) {
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

export default EditAvatarModal;