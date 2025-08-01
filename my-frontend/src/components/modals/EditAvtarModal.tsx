import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { updateUserAvatar } from "@/services/userService";
import { UserResponseDTO } from "@/interfaces";

interface EditAvatarModalProps {
  profile: UserResponseDTO;
  onClose: () => void;
  onUpdate: (updatedProfile: UserResponseDTO) => void;
}

const getCroppedImg = async (imageSrc: string, croppedAreaPixels: Area): Promise<File> => {
  const image = new Image();
  image.src = imageSrc;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use the cropped area dimensions to maintain original resolution
      const { width, height } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;

      // Draw the cropped portion of the image onto the canvas
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
        0.95 // High quality to preserve details
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

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file size (max 5MB) and type
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
      const updatedProfile = await updateUserAvatar(profile.userId, croppedImage);
      onUpdate(updatedProfile);
      onClose();
    } catch (err: any) {
      setError("Failed to update avatar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Avatar</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="form-control mb-3"
              disabled={loading}
            />
            {imageSrc && (
              <div
                className="border rounded"
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "400px",
                  height: "400px",
                  margin: "0 auto",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // Square aspect for avatar
                  cropShape="round" // Circular crop preview to match HeaderProfile
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: { borderRadius: "8px" },
                    cropAreaStyle: { border: "2px solid #007bff" },
                  }}
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !imageSrc || !croppedAreaPixels}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAvatarModal;