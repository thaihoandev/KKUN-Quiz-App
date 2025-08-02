import { UserResponseDTO, PostType, Comment } from "@/interfaces";
import PostCard from "./PostCard";

interface PostListProps {
  posts: PostType[];
  profile: UserResponseDTO | null;
  onUpdate: (updatedPost: PostType) => void;
}

const PostList = ({
  posts,
  profile,
  onUpdate,
}: PostListProps) => {
  return (
    <>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <small className="card-text text-uppercase text-body-secondary small">
            Posts
          </small>
        </div>
      </div>
      <div className="post-list">
        {posts.length === 0 ? (
          <div className="text-center text-muted py-3">
            No posts yet. Share something!
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                profile={profile}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PostList;