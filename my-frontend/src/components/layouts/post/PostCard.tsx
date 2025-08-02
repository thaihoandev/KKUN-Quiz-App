import { formatDateOnly } from "@/utils/dateUtils";
import { UserResponseDTO } from "@/interfaces";
import { useState, useRef, useCallback, KeyboardEvent } from "react";

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

interface PostProps {
  post: PostType;
  profile: UserResponseDTO | null;
  onUpdate: (updatedPost: PostType) => void;
}

const PostCard: React.FC<PostProps> = ({ post, profile, onUpdate }) => {
  const [newComment, setNewComment] = useState("");
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const handleLike = useCallback(() => {
    const updated = { ...post, likes: post.likes + 1 };
    onUpdate(updated);
  }, [post, onUpdate]);

  const handleAddComment = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const newComm: Comment = {
        id: `${Date.now()}`,
        content: trimmed,
        createdAt: new Date(),
      };
      const updated = { ...post, comments: [...post.comments, newComm] };
      onUpdate(updated);
      setNewComment("");
      // focus back
      commentInputRef.current?.focus();
    },
    [post, onUpdate]
  );

  const handleShare = useCallback(() => {
    alert(`Share post ${post.id}`);
  }, [post.id]);

  const handleMoreOptions = useCallback(() => {
    alert(`More options for post ${post.id}`);
  }, [post.id]);

  const onCommentKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(newComment);
    }
  };

  const focusCommentInput = useCallback(() => {
    commentInputRef.current?.focus();
  }, []);

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="icon-base bx bx-user-circle fs-4" aria-hidden="true" />
            </div>
            <div>
              <h6 className="mb-0">{profile?.name || "User"}</h6>
              <small className="text-muted">{formatDateOnly(post.createdAt)}</small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-outline-secondary btn-sm rounded-circle"
            onClick={handleMoreOptions}
            title="More options"
            aria-label="More options"
          >
            <i className="icon-base bx bx-dots-horizontal-rounded" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <p className="card-text">{post.content}</p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Attachment ${index + 1}`}
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  objectFit: "cover",
                }}
                className="rounded"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="border-top pt-2 mt-3">
        <div className="d-flex w-100 gap-2 justify-content-between align-items-center mb-2">
            <button
            type="button"
            aria-label="Like"
            className="btn btn-outline-primary btn-sm d-flex align-items-center"
            onClick={handleLike}
            >
            <i className="icon-base bx bx-like me-1" aria-hidden="true" />
            <span>{post.likes} Likes</span>
            </button>

            <button
            type="button"
            aria-label="Comment"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            onClick={focusCommentInput}
            >
            <i className="icon-base bx bx-comment me-1" aria-hidden="true" />
            <span>{post.comments.length} Comments</span>
            </button>

            <button
            type="button"
            aria-label="Share"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            onClick={handleShare}
            >
            <i className="icon-base bx bx-share me-1" aria-hidden="true" />
            <span>Share</span>
            </button>
        </div>
        </div>


        {/* Comments Section */}
        {post.comments.length > 0 && (
          <div className="mt-3 border-top pt-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="d-flex mb-2">
                <div className="me-2">
                  <i className="icon-base bx bx-user fs-5" aria-hidden="true" />
                </div>
                <div>
                  <small className="fw-medium">{profile?.name || "User"}</small>
                  <p className="mb-0">{comment.content}</p>
                  <small className="text-muted">{formatDateOnly(comment.createdAt)}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        <div className="mt-3 d-flex align-items-center">
          <div className="me-2">
            <i className="icon-base bx bx-user-circle fs-5" aria-hidden="true" />
          </div>
          <div className="flex-grow-1">
            <input
                id={`comment-input-${post.id}`}
                ref={(el) => { commentInputRef.current = el; }} // <--- không trả về gì
                className="form-control form-control-sm"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={onCommentKeyDown}
                aria-label="Write a comment"
            />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm ms-2"
            onClick={() => handleAddComment(newComment)}
            disabled={!newComment.trim()}
            aria-label="Post comment"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
