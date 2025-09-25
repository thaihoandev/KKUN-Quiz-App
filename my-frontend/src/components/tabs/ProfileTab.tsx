import { formatDateOnly } from "@/utils/dateUtils";
import { UserResponseDTO } from "@/interfaces";
import { useState, useCallback } from "react";
import PostList from "../layouts/post/PostList";
import { PostDTO } from "@/services/postService";
import PostComposer from "../layouts/post/PostComposer";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import SelfPostList from "../layouts/post/SelfPostList";

interface ProfileTabProps {
  profile: UserResponseDTO | null;
  onEditProfile: () => void;
}

const ProfileTab = ({ profile, onEditProfile }: ProfileTabProps) => {
  const [newPost, setNewPost] = useState<PostDTO | null>(null); // chuyển qua nhận từ PostComposer

  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {
    // Update PostList via callback if needed
  }, []);

  return (
    <div className="container-fluid py-4">
      <div className="row g-3">
        {/* Left: About + Overview */}
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

        {/* Right: Composer + Posts */}
        <div className="col-lg-8">
          {/* Post Composer (đã tách riêng) */}
          {profile?.userId ? (
            <PostComposer
              userId={profile.userId}
              avatarUrl={profile.avatar || unknownAvatar}
              onCreated={(post) => setNewPost(post)}
            />
          ) : (
            <div className="card border-0 shadow-sm mb-3 rounded-4">
              <div className="card-body p-4 text-center text-muted">
                Please log in to create a post.
              </div>
            </div>
          )}

          {/* Post List */}
          {profile?.userId ? (
            <SelfPostList
              profile={profile}
              onUpdate={handlePostUpdate}
              userId={profile.userId}
              newPost={newPost}
            />
          ) : (
            <div className="text-center text-muted py-3">
              Please log in to view posts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
