import { formatDateOnly } from "@/utils/dateUtils";
import { UserResponseDTO } from "@/interfaces";
import { useState } from "react";
import PostList from "../layouts/post/PostList";

interface ProfileTabProps {
  profile: UserResponseDTO | null;
  onEditProfile: () => void;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
}

interface PostType {
  id: string;
  content: string;
  createdAt: Date;
  likes: number;
  comments: Comment[];
  images?: string[];
}

const ProfileTab = ({ profile, onEditProfile }: ProfileTabProps) => {
  const [posts, setPosts] = useState<PostType[]>([
    { id: "1", content: "Just completed a challenging quiz!", createdAt: new Date(), likes: 0, comments: [] },
    { id: "2", content: "Loving the new features!", createdAt: new Date(), likes: 0, comments: [] },
  ]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleAddPost = () => {
    if (newPostContent.trim() || selectedImages.length > 0) {
      const imageUrls = selectedImages.map((file) => URL.createObjectURL(file));
      setPosts([
        {
          id: `${Date.now()}`,
          content: newPostContent,
          createdAt: new Date(),
          likes: 0,
          comments: [],
          images: imageUrls,
        },
        ...posts,
      ]);
      setNewPostContent("");
      setSelectedImages([]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages([...selectedImages, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handlePostUpdate = (updatedPost: PostType) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  return (
    <div className="row g-4">
      <div className="col-xl-4 col-lg-5 col-md-6 col-sm-12">
        {/* About User */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body position-relative">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="card-text text-uppercase text-body-secondary small">
                About
              </small>
              <button
                className="btn btn-icon btn-outline-primary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
                onClick={onEditProfile}
                title="Edit Profile"
                aria-label="Edit profile"
              >
                <i className="icon-base bx bx-edit icon-sm"></i>
              </button>
            </div>
            <ul className="list-unstyled my-3 py-1">
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-user me-2"></i>
                <span className="fw-medium me-2">Full Name:</span>
                <span>{profile?.name || "N/A"}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-flag me-2"></i>
                <span className="fw-medium me-2">Email:</span>
                <span>{profile?.email || "N/A"}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-building me-2"></i>
                <span className="fw-medium me-2">School:</span>
                <span>{profile?.school || "N/A"}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <i className="icon-base bx bx-detail me-2"></i>
                <span className="fw-medium me-2">Created at:</span>
                <span>{profile?.createdAt ? formatDateOnly(profile.createdAt) : "N/A"}</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Profile Overview */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <small className="card-text text-uppercase text-body-secondary small">
              Overview
            </small>
            <div className="row row-cols-1 row-cols-md-2 g-3 p-3">
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body text-center">
                    <h6 className="card-title">Quizzes Taken</h6>
                    <p className="card-text text-muted">Coming soon!</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body text-center">
                    <h6 className="card-title">Achievements</h6>
                    <p className="card-text text-muted">Coming soon!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-8 col-lg-7 col-md-6 col-sm-12">
        {/* Create Post */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="flex-grow-1">
                <textarea
                  className="form-control"
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {selectedImages.map((image, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
                    className="rounded"
                  />
                  <button
                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                    style={{ transform: "translate(50%, -50%)" }}
                    onClick={() => removeImage(index)}
                  >
                    <i className="icon-base bx bx-x"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <label className="btn btn-outline-secondary btn-sm">
                <i className="icon-base bx bx-image-add me-1"></i>
                Add Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageChange}
                />
              </label>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddPost}
                disabled={!newPostContent.trim() && selectedImages.length === 0}
              >
                Post
              </button>
            </div>
          </div>
        </div>
        {/* Posts List */}
        <PostList
          posts={posts}
          profile={profile}
          onUpdate={handlePostUpdate}
        />
      </div>
    </div>
  );
};

export default ProfileTab;