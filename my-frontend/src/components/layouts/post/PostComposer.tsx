import { useEffect, useState } from "react";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { createPost, PostDTO, PostRequestDTO } from "@/services/postService";

type Privacy = "PUBLIC" | "FRIENDS" | "PRIVATE";

interface PostComposerProps {
  userId: string;
  avatarUrl?: string;
  onCreated?: (post: PostDTO) => void;
  maxImages?: number;      // default 5
  defaultPrivacy?: Privacy; // default PUBLIC
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

  // preview URLs
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

      // reset
      setContent("");
      setImages([]);
      setPrivacy(defaultPrivacy);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4 border-0 rounded-4">
      <div className="card-body">
        {/* lỗi (nếu có) */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            {error}
            <button type="button" className="btn btn-close" onClick={() => setError(null)} />
          </div>
        )}

        {/* top row: avatar + input pill (giống HomePostPage) */}
        <div className="d-flex align-items-center gap-3 mb-3">
          <img
            src={avatarUrl || unknownAvatar}
            alt="me"
            className="rounded-circle"
            width={44}
            height={44}
            style={{ objectFit: "cover" }}
          />
          <input
            className="form-control form-control-lg rounded-pill"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
          />
        </div>

        {/* previews (nếu có) */}
        {!!previews.length && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {previews.map((src, idx) => (
              <div key={idx} className="position-relative">
                <img
                  src={src}
                  alt="preview"
                  style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10 }}
                />
                <button
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                  style={{ width: 20, height: 20, lineHeight: "20px", transform: "translate(50%, -50%)" }}
                  onClick={() => removeImage(idx)}
                  disabled={isPosting}
                  aria-label="Remove image"
                >
                  <i className="bx bx-x m-0" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* bottom row: action pills giống HomePostPage */}
        <div className="d-flex gap-2 flex-wrap align-items-center">
          {/* Photo/Video → mở input file */}
          <label className="btn btn-light border rounded-pill px-3 mb-0">
            <i className="bx bx-image-alt me-1" />
            Photo/Video
            <input
              type="file"
              accept="image/*"
              hidden
              multiple
              onChange={handleImageChange}
              disabled={isPosting || images.length >= maxImages}
            />
          </label>

          {/* Poll (demo UI) */}
          <button
            className="btn btn-light border rounded-pill px-3"
            type="button"
            disabled
            title="Coming soon"
          >
            <i className="bx bx-poll me-1" />
            Poll
          </button>

          {/* Feeling/Activity (demo UI) */}
          <button
            className="btn btn-light border rounded-pill px-3"
            type="button"
            disabled
            title="Coming soon"
          >
            <i className="bx bx-smile me-1" />
            Feeling/Activity
          </button>

          {/* Privacy dropdown – hiển thị như pill để hợp UI, vẫn giữ chức năng */}
          <div className="dropdown">
            <button
              className="btn btn-light border rounded-pill px-3 dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              disabled={isPosting}
            >
              <i
                className={`me-1 ${
                  privacy === "PUBLIC"
                    ? "bx bx-globe"
                    : privacy === "FRIENDS"
                    ? "bx bx-group"
                    : "bx bx-lock"
                }`}
              />
              {privacy === "PUBLIC" ? "Public" : privacy === "FRIENDS" ? "Friends" : "Private"}
            </button>
            <ul className="dropdown-menu">
              <li>
                <button className="dropdown-item" onClick={() => setPrivacy("PUBLIC")}>
                  <i className="bx bx-globe me-2" />
                  Public
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => setPrivacy("FRIENDS")}>
                  <i className="bx bx-group me-2" />
                  Friends
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => setPrivacy("PRIVATE")}>
                  <i className="bx bx-lock me-2" />
                  Private
                </button>
              </li>
            </ul>
          </div>

          {/* Post button ở mép phải */}
          <button
            className="btn btn-primary ms-auto rounded-pill px-4"
            onClick={handlePost}
            disabled={isPosting || (!content.trim() && images.length === 0)}
          >
            {isPosting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Posting…
              </>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
