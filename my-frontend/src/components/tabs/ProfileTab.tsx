import { formatDateOnly } from "@/utils/dateUtils";
import { UserResponseDTO} from "@/interfaces";
import { useState, useEffect } from "react";
import PostList from "../layouts/post/PostList";
import { createPost, getUserPosts, PostDTO, PostRequestDTO } from "@/services/postService";

interface ProfileTabProps {
  profile: UserResponseDTO | null;
  onEditProfile: () => void;
}

const ProfileTab = ({ profile, onEditProfile }: ProfileTabProps) => {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [postPrivacy, setPostPrivacy] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (profile?.userId) {
        try {
          const userPosts = await getUserPosts(profile.userId);
          setPosts(userPosts);
        } catch (err) {
          setError("Failed to load posts. Please try again.");
          console.error(err);
        }
      }
    };
    fetchPosts();
  }, [profile?.userId]);

  const handleAddPost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) {
      setError("Please add content or images to post");
      return;
    }
    if (!profile?.userId) {
      setError("User ID is required to create a post");
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const mediaWithDimensions = await Promise.all(
        selectedImages.map(async (file, index) => {
          const dimensions = await getImageDimensions(file);
          return {
            mimeType: file.type,
            sizeBytes: file.size,
            width: dimensions.width,
            height: dimensions.height,
            caption: "",
            isCover: index === 0,
          };
        })
      );

      const postData: PostRequestDTO = {
        content: newPostContent,
        privacy: postPrivacy,
        media: mediaWithDimensions,
      };

      const formData = new FormData();
      formData.append('post', new Blob([JSON.stringify(postData)], { type: "application/json" }));
      if (selectedImages.length > 0) {
        selectedImages.forEach((file) => {
          formData.append('mediaFiles', file);
        });
      }

      const newPost: PostDTO = await createPost(profile.userId, formData);
      setPosts([newPost, ...posts]);
      setNewPostContent("");
      setSelectedImages([]);
      setPostPrivacy('PUBLIC');
    } catch (err) {
      setError("Failed to create post. Please try again.");
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setSelectedImages([...selectedImages, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handlePostUpdate = (updatedPost: PostDTO) => {
    setPosts(posts.map((p) => (p.postId === updatedPost.postId ? updatedPost : p)));
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
    });
  };

  const privacyOptions = [
    { value: 'PUBLIC', label: 'Public', icon: 'bx bx-globe' },
    { value: 'FRIENDS', label: 'Friends', icon: 'bx bx-group' },
    { value: 'PRIVATE', label: 'Private', icon: 'bx bx-lock' },
  ];

  return (
    <div className="container-fluid py-4">
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-uppercase text-muted small">About</h6>
                <button
                  className="btn btn-outline-primary btn-sm rounded-circle p-1"
                  onClick={onEditProfile}
                  title="Edit Profile"
                  aria-label="Edit profile"
                >
                  <i className="bx bx-edit"></i>
                </button>
              </div>
              <ul className="list-unstyled mb-0">
                <li className="d-flex align-items-center mb-2">
                  <i className="bx bx-user me-2 text-muted"></i>
                  <span className="fw-medium me-2">Name:</span>
                  <span>{profile?.name || "N/A"}</span>
                </li>
                <li className="d-flex align-items-center mb-2">
                  <i className="bx bx-envelope me-2 text-muted"></i>
                  <span className="fw-medium me-2">Email:</span>
                  <span>{profile?.email || "N/A"}</span>
                </li>
                <li className="d-flex align-items-center mb-2">
                  <i className="bx bx-building me-2 text-muted"></i>
                  <span className="fw-medium me-2">School:</span>
                  <span>{profile?.school || "N/A"}</span>
                </li>
                <li className="d-flex align-items-center">
                  <i className="bx bx-calendar me-2 text-muted"></i>
                  <span className="fw-medium me-2">Joined:</span>
                  <span>{profile?.createdAt ? formatDateOnly(profile.createdAt) : "N/A"}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-3">Overview</h6>
              <div className="row g-3">
                <div className="col-6">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body text-center p-3">
                      <h6 className="mb-1">Quizzes Taken</h6>
                      <p className="text-muted mb-0 small">Coming soon!</p>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body text-center p-3">
                      <h6 className="mb-1">Achievements</h6>
                      <p className="text-muted mb-0 small">Coming soon!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
              )}
              <textarea
                className="form-control border-0 shadow-sm mb-3"
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={2}
                disabled={isPosting}
                style={{ resize: 'none', background: '#f8f9fa' }}
              />
              <div className="d-flex flex-wrap gap-2 mb-3">
                {selectedImages.map((image, index) => (
                  <div key={index} className="position-relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Preview"
                      style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }}
                    />
                    <button
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                      style={{ width: "20px", height: "20px", lineHeight: "20px", transform: "translate(50%, -50%)" }}
                      onClick={() => removeImage(index)}
                      disabled={isPosting}
                    >
                      <i className="bx bx-x m-0"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    disabled={isPosting}
                  >
                    <i className={privacyOptions.find(opt => opt.value === postPrivacy)?.icon + " me-1"}></i>
                    {privacyOptions.find(opt => opt.value === postPrivacy)?.label}
                  </button>
                  <ul className="dropdown-menu">
                    {privacyOptions.map((option) => (
                      <li key={option.value}>
                        <button
                          className="dropdown-item"
                          onClick={() => setPostPrivacy(option.value as 'PUBLIC' | 'FRIENDS' | 'PRIVATE')}
                        >
                          <i className={`${option.icon} me-2`}></i>
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="btn btn-outline-secondary btn-sm me-2">
                    <i className="bx bx-image-add me-1"></i>
                    Image
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleImageChange}
                      disabled={isPosting}
                    />
                  </label>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddPost}
                    disabled={isPosting || (!newPostContent.trim() && selectedImages.length === 0)}
                  >
                    {isPosting ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    ) : null}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
          <PostList
            posts={posts}
            profile={profile}
            onUpdate={handlePostUpdate}
            userId={profile?.userId || ""} // Pass userId from profile
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;