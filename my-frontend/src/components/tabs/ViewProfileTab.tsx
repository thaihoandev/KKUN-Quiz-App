import { formatDateOnly } from "@/utils/dateUtils";
import { UserResponseDTO } from "@/interfaces";
import PostList from "../layouts/post/PostList";
import { useCallback, useState } from "react";
import { PostDTO } from "@/services/postService";
import SelfPostList from "../layouts/post/SelfPostList";

interface ViewProfileTabProps {
  profile: UserResponseDTO | null;
}

const ViewProfileTab = ({ profile }: ViewProfileTabProps) => {
  const [newPost, setNewPost] = useState<PostDTO | null>(null);

  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {
    // TODO: cập nhật local state nếu cần (like/unlike, sửa bài, v.v.)
    // Ví dụ:
    // if (newPost && newPost.postId === updatedPost.postId) {
    //   setNewPost(updatedPost);
    // }
  }, []);

  return (
    <div className="container-fluid py-4">
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-3">About</h6>
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
          {profile?.userId ? (
            <SelfPostList
              profile={profile}
              onUpdate={handlePostUpdate}
              userId={profile.userId}
              newPost={newPost}
              className=""
            />
          ) : (
            <div className="text-center text-muted py-3">
              No profile to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProfileTab;
